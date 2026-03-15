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
  private lastPPCMeta: PointCloudMeta | null = null;
  private ppcMetaHolder: Map<string, PointCloudMeta> = new Map();
  private ppcChunkHolder: Map<string, PointCloudChunk[]> = new Map();

  public convertData(data: ArrayBuffer): PointCloudData {
    const ppcMeta = this.tryParseMeta(data);
    if (ppcMeta) {
      // console.log("📥 Received PPC Meta:", ppcMeta);
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
    // console.log("📥 Received PPC Chunk:", ppcChunk?.pointSize);

    // ppc chunk 가 ppc meta 보다 먼저 도착하는 상황은 없다고 가정
    const foundPpcMeta = this.ppcMetaHolder.get(ppcChunk.frameId);
    if (!foundPpcMeta) {
      return {
        dataPresent: false,
      };
    }

    this.savePPCChunk(ppcChunk, foundPpcMeta);

    // 청크 누적
    const accumulated = this.ppcChunkHolder.get(ppcChunk.frameId) ?? [];
    accumulated.push(ppcChunk);
    this.ppcChunkHolder.set(ppcChunk.frameId, accumulated);

    // expected_chunk_num 개 모두 도착하기 전까지는 대기
    if (accumulated.length < foundPpcMeta.expected_chunk_num - 1) {
      return { dataPresent: false };
    }

    // 모든 청크 도착 → 처리 후 정리
    this.ppcChunkHolder.delete(ppcChunk.frameId);
    try {
      return this.processAllPPCChunks(accumulated, foundPpcMeta);
    } catch (error) {
      console.error("Process PPC Chunk Error:", error);
      return { dataPresent: false };
    }
  }

  private processPPCMeta(ppcMeta: PointCloudMeta) {
    // 새로운 프레임의 ppc meta 도착, 저장
    this.ppcMetaHolder.set(ppcMeta.frameId, ppcMeta);
  }

  // 모든 청크가 도착했을 때 한 번에 처리. 오래된 프레임은 무시.
  private processAllPPCChunks(
    ppcChunks: PointCloudChunk[],
    ppcMeta: PointCloudMeta,
  ): PointCloudData {
    if (!this.lastPPCMeta) {
      this.lastPPCMeta = ppcMeta;
    } else if (
      ppcMeta.frameId !== this.lastPPCMeta.frameId &&
      ppcMeta.timestamp < this.lastPPCMeta.timestamp
    ) {
      return { dataPresent: false };
    } else if (
      ppcMeta.frameId !== this.lastPPCMeta.frameId &&
      ppcMeta.timestamp >= this.lastPPCMeta.timestamp
    ) {
      this.lastPPCMeta = ppcMeta;
    }

    const ppcPoints: PointCloudPoint[] = [];

    for (const ppcChunk of ppcChunks) {
      const numPoints = ppcChunk.pointSize;
      const dataView = new DataView(ppcChunk.data.buffer, ppcChunk.data.byteOffset);

      for (let i = 0; i < numPoints; i++) {
        const pointOffset = i * ppcMeta.pointStep;

        const x = dataView.getFloat32(pointOffset + ppcMeta.xOffset, !ppcMeta.isBigEndian);
        const y = dataView.getFloat32(pointOffset + ppcMeta.yOffset, !ppcMeta.isBigEndian);
        const z = dataView.getFloat32(pointOffset + ppcMeta.zOffset, !ppcMeta.isBigEndian);
        const intensity = dataView.getFloat32(
          pointOffset + ppcMeta.intensityOffset,
          !ppcMeta.isBigEndian,
        );

        const point = { x, y, z, intensity };

        if (!Number.isFinite(point.x)) point.x = 0;
        if (!Number.isFinite(point.y)) point.y = 0;
        if (!Number.isFinite(point.z)) point.z = 0;
        if (!Number.isFinite(point.intensity)) point.intensity = 0;

        ppcPoints.push(point);
      }
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
      const protoPPCMeta = PointCloud.PCMeta.decode(new Uint8Array(buffer));

      // 필드 매핑 생성: 필요한 필드들의 offset 정보를 찾음
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
    } catch (error) {
      // console.error("❌ Error decoding data chunk:", error);
      return null;
    }
  }

  private tryParseChunk(buffer: ArrayBuffer): PointCloudChunk | null {
    try {
      const protoPPCChunk = PointCloud.PCChunk.decode(new Uint8Array(buffer));
      return {
        timestamp: protoPPCChunk.timestamp,
        receivedTimestamp: (performance.timeOrigin + performance.now()) * 1000,
        frameId: protoPPCChunk.frameId,
        chunkIndex: protoPPCChunk.chunkIndex,
        pointSize: protoPPCChunk.pointSize,
        data: protoPPCChunk.data,
      };
    } catch (error) {
      // console.error("❌ Error decoding data chunk:", error);
      return null;
    }
  }

  public clearOldMeta() {
    const now = Date.now();
    for (const [frameId, ppcMeta] of this.ppcMetaHolder.entries()) {
      if (now - Number(ppcMeta.timestamp) > 30000) {
        // 30초 이상된 메타데이터 및 누적 청크 삭제
        this.ppcMetaHolder.delete(frameId);
        this.ppcChunkHolder.delete(frameId);
      }
    }
  }

  public clearAll() {
    // TODO: 연구를 위해 우선은 모두 유지
    // this.ppcMetaHolder.clear()
  }
}
