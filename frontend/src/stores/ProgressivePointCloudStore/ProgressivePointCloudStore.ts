import type {
  PointCloudMeta,
  PointCloudChunk,
  PointCloudData,
  PointCloudPoint,
} from "@/stores/@types/pointcloud.ts";

import { ReceivableStore } from "@/mosaic/store/interface/receivable-store.ts";
import { ProgressivePointCloud } from "@/protobuf/proto";

export class ProgressivePointCloudStore extends ReceivableStore<PointCloudData> {
  public isParallelReceivable = true;
  private lastPPCMeta: PointCloudMeta | null = null;
  private ppcMetaHolder: Map<string, PointCloudMeta> = new Map();

  public convertData(data: ArrayBuffer): PointCloudData {
    const ppcMeta = this.tryParseMeta(data);
    if (ppcMeta) {
      this.processPPCMeta(ppcMeta);
      return {
        dataPresent: false,
      };
    }
    const ppcChunk = this.tryParseChunk(data);
    if (!ppcChunk) {
      return {
        dataPresent: false,
      };
    }

    // Assumes ppc chunk never arrives before ppc meta
    const foundPpcMeta = this.ppcMetaHolder.get(ppcChunk.frameId);
    if (!foundPpcMeta) {
      return {
        dataPresent: false,
      };
    }

    this.savePPCChunk(ppcChunk, foundPpcMeta);
    try {
      return this.processPPCChunk(ppcChunk, foundPpcMeta);
    } catch (error) {
      console.error("Process PPC Chunk Error:", error);
      return {
        dataPresent: false,
      };
    }
  }

  private processPPCMeta(ppcMeta: PointCloudMeta) {
    // New frame's ppc meta arrived, save it
    this.ppcMetaHolder.set(ppcMeta.frameId, ppcMeta);
  }

  // This method handles ignoring outdated chunks, so the receiver can simply process based on the meta of the last arrived frame
  private processPPCChunk(ppcChunk: PointCloudChunk, ppcMeta: PointCloudMeta): PointCloudData {
    // Ignore if the next frame has already arrived and a chunk comes in
    if (!this.lastPPCMeta) {
      // First frame
      this.lastPPCMeta = ppcMeta;
    } else if (
      ppcMeta.frameId !== this.lastPPCMeta.frameId && // Different from the last processed frame
      ppcMeta.timestamp < this.lastPPCMeta.timestamp // Chunk from an older frame arrived
    ) {
      return {
        dataPresent: false,
      };
    } else if (
      ppcMeta.frameId !== this.lastPPCMeta.frameId && // Different from the last processed frame
      ppcMeta.timestamp >= this.lastPPCMeta.timestamp // Chunk from a newer frame arrived
    ) {
      this.lastPPCMeta = ppcMeta; // Start processing new frame
    }

    const ppcPoints: PointCloudPoint[] = [];

    const numPoints = ppcChunk.pointSize;
    // Create DataView only once
    const dataView = new DataView(ppcChunk.data.buffer, ppcChunk.data.byteOffset);

    for (let i = 0; i < numPoints; i++) {
      const pointOffset = i * ppcMeta.pointStep;

      // Read directly from memory (no memory allocation)
      const x = dataView.getFloat32(pointOffset + ppcMeta.xOffset, !ppcMeta.isBigEndian); // little-endian
      const y = dataView.getFloat32(pointOffset + ppcMeta.yOffset, !ppcMeta.isBigEndian);
      const z = dataView.getFloat32(pointOffset + ppcMeta.zOffset, !ppcMeta.isBigEndian);
      const intensity = dataView.getFloat32(
        pointOffset + ppcMeta.intensityOffset,
        !ppcMeta.isBigEndian,
      );

      const point = { x, y, z, intensity };

      // Validate values (same as before)
      if (!Number.isFinite(point.x)) point.x = 0;
      if (!Number.isFinite(point.y)) point.y = 0;
      if (!Number.isFinite(point.z)) point.z = 0;
      if (!Number.isFinite(point.intensity)) point.intensity = 0;

      ppcPoints.push(point);
    }

    return {
      dataPresent: true,
      meta: ppcMeta,
      points: ppcPoints,
    };
  }

  private savePPCChunk(ppcChunk: PointCloudChunk, ppcMeta: PointCloudMeta) {
    ppcMeta.chunks.push({
      timestamp: ppcChunk.timestamp,
      receivedTimestamp: ppcChunk.receivedTimestamp,
      frameId: ppcChunk.frameId,
      chunkIndex: ppcChunk.chunkIndex,
      pointSize: ppcChunk.pointSize,
    });
  }

  private tryParseMeta(buffer: ArrayBuffer): PointCloudMeta | null {
    try {
      const protoPPCMeta = ProgressivePointCloud.PPCMeta.decode(new Uint8Array(buffer));

      // Build field mapping: find offset info for required fields
      const requiredFields = ["x", "y", "z", "intensity"];
      const fieldMapping: Record<string, number> = {};

      for (const field of protoPPCMeta.fields) {
        if (field.name && requiredFields.includes(field.name) && field.offset != null) {
          fieldMapping[field.name] = field.offset;
        }
      }

      return {
        timestamp: protoPPCMeta.timestamp,
        receivedTimestamp: (performance.timeOrigin + performance.now()) * 1000,
        frameId: protoPPCMeta.frameId,

        height: protoPPCMeta.height || 0,
        width: protoPPCMeta.width || 0,
        isBigEndian: protoPPCMeta.isBigendian || false,
        pointStep: protoPPCMeta.pointStep || 0,
        rowStep: protoPPCMeta.rowStep || 0,
        isDense: protoPPCMeta.isDense || false,

        xOffset: fieldMapping.x || 0,
        yOffset: fieldMapping.y || 0,
        zOffset: fieldMapping.z || 0,
        intensityOffset: fieldMapping.intensity || 0,

        min_x: protoPPCMeta.minX || 0,
        max_x: protoPPCMeta.maxX || 0,
        min_y: protoPPCMeta.minY || 0,
        max_y: protoPPCMeta.maxY || 0,
        min_z: protoPPCMeta.minZ || 0,
        max_z: protoPPCMeta.maxZ || 0,

        expected_chunk_num: protoPPCMeta.expectedChunkNum || 0,

        chunks: [],
      };
    } catch {
      return null;
    }
  }

  private tryParseChunk(buffer: ArrayBuffer): PointCloudChunk | null {
    try {
      const protoPPCChunk = ProgressivePointCloud.PPCChunk.decode(new Uint8Array(buffer));
      return {
        timestamp: protoPPCChunk.timestamp,
        receivedTimestamp: (performance.timeOrigin + performance.now()) * 1000,
        frameId: protoPPCChunk.frameId,
        chunkIndex: protoPPCChunk.chunkIndex,
        pointSize: protoPPCChunk.pointSize,
        data: protoPPCChunk.data,
      };
    } catch {
      return null;
    }
  }

  public clearOldMeta() {
    const now = Date.now();
    for (const [frameId, ppcMeta] of this.ppcMetaHolder.entries()) {
      if (now - Number(ppcMeta.timestamp) > 30000) {
        // Delete metadata older than 30 seconds
        this.ppcMetaHolder.delete(frameId);
      }
    }
  }

  public clearAll() {
    // TODO: Keep all for now for research purposes
    // this.ppcMetaHolder.clear()
  }
}
