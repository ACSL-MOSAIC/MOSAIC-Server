import type {
  PPCMeta,
  PPCChunk,
  PPCData,
  PPCPoint,
} from "@/stores/@types/progressive-pointcloud.ts";

import { ReceivableStore } from "@/mosaic/store/interface/receivable-store.ts";
import { ProgressivePointCloud } from "@/protobuf/proto";

export class ProgressivePointCloudStore extends ReceivableStore<PPCData> {
  private lastPPCMeta: PPCMeta | null = null;
  private ppcMetaHolder: Map<string, PPCMeta> = new Map();

  public convertData(data: ArrayBuffer): PPCData {
    const ppcMeta = this.tryParseMeta(data);
    if (ppcMeta) {
      console.log("📥 Received PPC Meta:", ppcMeta);
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
    console.log("📥 Received PPC Chunk:", ppcChunk?.pointSize);

    // ppc chunk 가 ppc meta 보다 먼저 도착하는 상황은 없다고 가정
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

  private processPPCMeta(ppcMeta: PPCMeta) {
    // 새로운 프레임의 ppc meta 도착, 저장
    this.ppcMetaHolder.set(ppcMeta.frameId, ppcMeta);
  }

  // 해당 메소드에서 오래된 청크의 무시 과정이 이루어지기 때문에 받는 쪽에서는 그냥 마지막 들어온 프레임의 meta 를 기준으로 처리하면 됨
  private processPPCChunk(ppcChunk: PPCChunk, ppcMeta: PPCMeta): PPCData {
    // 이미 다음 프레임이 왔고, 청크가 왔다면 무시
    if (!this.lastPPCMeta) {
      // 첫 프레임
      this.lastPPCMeta = ppcMeta;
    } else if (
      ppcMeta.frameId !== this.lastPPCMeta.frameId && // 마지막 처리한 프레임과 다름
      ppcMeta.timestamp < this.lastPPCMeta.timestamp // 예전 프레임의 청크 도착
    ) {
      return {
        dataPresent: false,
      };
    } else if (
      ppcMeta.frameId !== this.lastPPCMeta.frameId && // 마지막 처리한 프레임과 다름
      ppcMeta.timestamp >= this.lastPPCMeta.timestamp // 새로운 프레임의 청크 도착
    ) {
      this.lastPPCMeta = ppcMeta; // 새로운 프레임 프로세싱 시작
    }

    const ppcPoints: PPCPoint[] = [];

    const numPoints = ppcChunk.pointSize;
    // DataView를 한 번만 생성
    const dataView = new DataView(ppcChunk.data.buffer, ppcChunk.data.byteOffset);

    for (let i = 0; i < numPoints; i++) {
      const pointOffset = i * ppcMeta.pointStep;

      // 직접 메모리에서 읽기 (메모리 할당 없음)
      const x = dataView.getFloat32(pointOffset + ppcMeta.xOffset, !ppcMeta.isBigEndian); // little-endian
      const y = dataView.getFloat32(pointOffset + ppcMeta.yOffset, !ppcMeta.isBigEndian);
      const z = dataView.getFloat32(pointOffset + ppcMeta.zOffset, !ppcMeta.isBigEndian);
      const intensity = dataView.getFloat32(
        pointOffset + ppcMeta.intensityOffset,
        !ppcMeta.isBigEndian,
      );

      const point = { x, y, z, intensity };

      // 유효성 검사 (기존과 동일)
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

  private savePPCChunk(ppcChunk: PPCChunk, ppcMeta: PPCMeta) {
    ppcMeta.chunks.push({
      timestamp: ppcChunk.timestamp,
      receivedTimestamp: ppcChunk.receivedTimestamp,
      frameId: ppcChunk.frameId,
      chunkIndex: ppcChunk.chunkIndex,
      pointSize: ppcChunk.pointSize,
    });
  }

  private tryParseMeta(buffer: ArrayBuffer): PPCMeta | null {
    try {
      const protoPPCMeta = ProgressivePointCloud.PPCMeta.decode(new Uint8Array(buffer));

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

        chunks: [],
      };
    } catch (error) {
      console.error("❌ Error decoding data chunk:", error);
      return null;
    }
  }

  private tryParseChunk(buffer: ArrayBuffer): PPCChunk | null {
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
    } catch (error) {
      console.error("❌ Error decoding data chunk:", error);
      return null;
    }
  }

  public clearOldMeta() {
    const now = Date.now();
    for (const [frameId, ppcMeta] of this.ppcMetaHolder.entries()) {
      if (now - Number(ppcMeta.timestamp) > 30000) {
        // 30초 이상된 메타데이터 삭제
        this.ppcMetaHolder.delete(frameId);
      }
    }
  }

  public clearAll() {
    // TODO: 연구를 위해 우선은 모두 유지
    // this.ppcMetaHolder.clear()
  }
}
