import type {
  PointCloudMeta,
  PointCloudChunk,
  PointCloudData,
  PointCloudPoint,
} from "@/stores/@types/pointcloud.ts";

import { ReceivableStore } from "@/mosaic/store/interface/receivable-store.ts";
import { PointCloud } from "@/protobuf/proto";

export class PointCloudStore extends ReceivableStore<PointCloudData> {
  public isParallelReceivable = true;
  private lastPCMeta: PointCloudMeta | null = null;
  private pcMetaHolder: Map<string, PointCloudMeta> = new Map();
  private pcChunkHolder: Map<string, PointCloudChunk[]> = new Map();

  public convertData(data: ArrayBuffer): PointCloudData {
    const pcMeta = this.tryParseMeta(data);
    if (pcMeta) {
      this.processPCMeta(pcMeta);
      return {
        dataPresent: false,
      };
    }
    const pcChunk = this.tryParseChunk(data);
    if (!pcChunk) {
      return {
        dataPresent: false,
      };
    }

    // Assumes pc chunk never arrives before ppc meta
    const foundPcMeta = this.pcMetaHolder.get(pcChunk.frameId);
    if (!foundPcMeta) {
      return {
        dataPresent: false,
      };
    }

    this.savePCChunk(pcChunk, foundPcMeta);

    // Accumulate chunks
    const accumulated = this.pcChunkHolder.get(pcChunk.frameId) ?? [];
    accumulated.push(pcChunk);
    this.pcChunkHolder.set(pcChunk.frameId, accumulated);

    // Wait until all expected_chunk_num chunks have arrived
    if (accumulated.length < foundPcMeta.expected_chunk_num - 1) {
      return { dataPresent: false };
    }

    // All chunks arrived → process and clean up
    this.pcChunkHolder.delete(pcChunk.frameId);
    try {
      return this.processAllPCChunks(accumulated, foundPcMeta);
    } catch (error) {
      console.error("Process PC Chunk Error:", error);
      return { dataPresent: false };
    }
  }

  private processPCMeta(pcMeta: PointCloudMeta) {
    // New frame's pc meta arrived, save it
    this.pcMetaHolder.set(pcMeta.frameId, pcMeta);
  }

  // Process all chunks at once when they all arrive. Ignore outdated frames.
  private processAllPCChunks(pcChunks: PointCloudChunk[], pcMeta: PointCloudMeta): PointCloudData {
    if (!this.lastPCMeta) {
      this.lastPCMeta = pcMeta;
    } else if (
      pcMeta.frameId !== this.lastPCMeta.frameId &&
      pcMeta.timestamp < this.lastPCMeta.timestamp
    ) {
      return { dataPresent: false };
    } else if (
      pcMeta.frameId !== this.lastPCMeta.frameId &&
      pcMeta.timestamp >= this.lastPCMeta.timestamp
    ) {
      this.lastPCMeta = pcMeta;
    }

    const pcPoints: PointCloudPoint[] = [];

    for (const pcChunk of pcChunks) {
      const numPoints = pcChunk.pointSize;
      const dataView = new DataView(pcChunk.data.buffer, pcChunk.data.byteOffset);

      for (let i = 0; i < numPoints; i++) {
        const pointOffset = i * pcMeta.pointStep;

        const x = dataView.getFloat32(pointOffset + pcMeta.xOffset, !pcMeta.isBigEndian);
        const y = dataView.getFloat32(pointOffset + pcMeta.yOffset, !pcMeta.isBigEndian);
        const z = dataView.getFloat32(pointOffset + pcMeta.zOffset, !pcMeta.isBigEndian);
        const intensity = dataView.getFloat32(
          pointOffset + pcMeta.intensityOffset,
          !pcMeta.isBigEndian,
        );

        const point = { x, y, z, intensity };

        if (!Number.isFinite(point.x)) point.x = 0;
        if (!Number.isFinite(point.y)) point.y = 0;
        if (!Number.isFinite(point.z)) point.z = 0;
        if (!Number.isFinite(point.intensity)) point.intensity = 0;

        pcPoints.push(point);
      }
    }

    return {
      dataPresent: true,
      meta: pcMeta,
      points: pcPoints,
    };
  }

  private savePCChunk(pcChunk: PointCloudChunk, pcMeta: PointCloudMeta) {
    pcMeta.chunks.push({
      timestamp: pcChunk.timestamp,
      receivedTimestamp: pcChunk.receivedTimestamp,
      frameId: pcChunk.frameId,
      chunkIndex: pcChunk.chunkIndex,
      pointSize: pcChunk.pointSize,
    });
  }

  private tryParseMeta(buffer: ArrayBuffer): PointCloudMeta | null {
    try {
      const protoPCMeta = PointCloud.PCMeta.decode(new Uint8Array(buffer));

      // Build field mapping: find offset info for required fields
      const requiredFields = ["x", "y", "z", "intensity"];
      const fieldMapping: Record<string, number> = {};

      for (const field of protoPCMeta.fields) {
        if (field.name && requiredFields.includes(field.name) && field.offset != null) {
          fieldMapping[field.name] = field.offset;
        }
      }

      return {
        timestamp: protoPCMeta.timestamp,
        receivedTimestamp: (performance.timeOrigin + performance.now()) * 1000,
        frameId: protoPCMeta.frameId,

        height: protoPCMeta.height || 0,
        width: protoPCMeta.width || 0,
        isBigEndian: protoPCMeta.isBigendian || false,
        pointStep: protoPCMeta.pointStep || 0,
        rowStep: protoPCMeta.rowStep || 0,
        isDense: protoPCMeta.isDense || false,

        xOffset: fieldMapping.x || 0,
        yOffset: fieldMapping.y || 0,
        zOffset: fieldMapping.z || 0,
        intensityOffset: fieldMapping.intensity || 0,

        min_x: protoPCMeta.minX || 0,
        max_x: protoPCMeta.maxX || 0,
        min_y: protoPCMeta.minY || 0,
        max_y: protoPCMeta.maxY || 0,
        min_z: protoPCMeta.minZ || 0,
        max_z: protoPCMeta.maxZ || 0,

        expected_chunk_num: protoPCMeta.expectedChunkNum || 0,

        chunks: [],
      };
    } catch {
      return null;
    }
  }

  private tryParseChunk(buffer: ArrayBuffer): PointCloudChunk | null {
    try {
      const protoPCChunk = PointCloud.PCChunk.decode(new Uint8Array(buffer));
      return {
        timestamp: protoPCChunk.timestamp,
        receivedTimestamp: (performance.timeOrigin + performance.now()) * 1000,
        frameId: protoPCChunk.frameId,
        chunkIndex: protoPCChunk.chunkIndex,
        pointSize: protoPCChunk.pointSize,
        data: protoPCChunk.data,
      };
    } catch {
      return null;
    }
  }

  public clearOldMeta() {
    const now = Date.now();
    for (const [frameId, ppcMeta] of this.pcMetaHolder.entries()) {
      if (now - Number(ppcMeta.timestamp) > 30000) {
        // Delete metadata and accumulated chunks older than 30 seconds
        this.pcMetaHolder.delete(frameId);
        this.pcChunkHolder.delete(frameId);
      }
    }
  }

  public clearAll() {
    // TODO: Keep all for now for research purposes
    // this.pcMetaHolder.clear()
  }
}
