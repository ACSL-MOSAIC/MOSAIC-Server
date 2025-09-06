import type { DelayMeasurement } from "@/dashboard/store/data-channel-store/readonly/lidar-point-cloud.store.ts"
import type { ParsedData } from "./parsed.type"
import { chunking, pointcloud } from "./protobuf/proto"

export interface LiDARPoint {
  x: number | null
  y: number | null
  z: number | null
  intensity: number | null
}

export interface LiDARPoints {
  header: {
    stamp: number | null
    frameId: string | null
    messageId: string
  }
  height: number
  width: number
  isBigendian: boolean
  pointStep: number
  rowStep: number
  isDense: boolean
  datas: LiDARPoint[]
}

interface ChunkData {
  messageId: string
  chunks: Map<number, Uint8Array>
  totalChunks: number
  sentTimestamp: number | Long // 로봇이 point cloud 를 전송한 시각
  timestamp: number
  startTime: number // 첫 번째 청크 도착 시간
  receivedChunks: Set<number> // 실제로 받은 청크 인덱스 추적
}

// 전역 chunkMap과 cleanup 타이머
const chunkMap: Map<string, ChunkData> = new Map()
const CHUNK_TIMEOUT = 5000 // 5초
const MAX_CONCURRENT_MESSAGES = 3 // 최대 2개의 메시지 동시 처리

// 주기적으로 오래된 chunk 데이터 정리
setInterval(() => {
  const now = Date.now()
  for (const [messageId, chunkData] of chunkMap.entries()) {
    if (now - chunkData.timestamp > CHUNK_TIMEOUT) {
      chunkMap.delete(messageId)
    }
  }
}, CHUNK_TIMEOUT)

const combineChunks = (chunkData: ChunkData): Uint8Array => {
  const totalSize = Array.from(chunkData.chunks.values()).reduce(
    (sum, chunk) => sum + chunk.length,
    0,
  )

  const combinedData = new Uint8Array(totalSize)
  let offset = 0

  // chunk들을 chunkIndex 순서대로 조합 (순서 보장)
  const sortedChunkIndices = Array.from(chunkData.receivedChunks).sort(
    (a, b) => a - b,
  )

  for (const chunkIndex of sortedChunkIndices) {
    const chunk = chunkData.chunks.get(chunkIndex)
    if (!chunk) {
      throw new Error(
        `Missing chunk ${chunkIndex} for message ${chunkData.messageId}`,
      )
    }

    combinedData.set(chunk, offset)
    offset += chunk.length
  }

  return combinedData
}

export type ParsedPointCloud2 = ParsedData<LiDARPoints>

export const parsePointCloud2 = (
  buffer: ArrayBuffer,
  delayMeasurements: DelayMeasurement,
): ParsedPointCloud2 | null => {
  try {
    const dataChunk = chunking.DataChunk.decode(new Uint8Array(buffer))
    return parsePointCloud2FromDataChunk(dataChunk, delayMeasurements)
  } catch (error) {
    console.error("❌ Error decoding data chunk:", error)
    return null
  }
}

export const parsePointCloud2FromDataChunk = (
  dataChunk: chunking.DataChunk,
  delayMeasurements: DelayMeasurement,
): ParsedPointCloud2 | null => {
  try {
    // 새로운 메시지 ID인 경우 초기화 (최대 2개까지만 유지)
    if (!chunkMap.has(dataChunk.messageId)) {
      // 최대 개수 초과 시 가장 오래된 메시지 삭제
      if (chunkMap.size >= MAX_CONCURRENT_MESSAGES) {
        const oldestMessageId = Array.from(chunkMap.entries()).sort(
          (a, b) => a[1].timestamp - b[1].timestamp,
        )[0][0]
        chunkMap.delete(oldestMessageId)
        console.log("Removed oldest message!")
      }

      const startTime = Date.now()
      chunkMap.set(dataChunk.messageId, {
        messageId: dataChunk.messageId,
        chunks: new Map(),
        totalChunks: dataChunk.totalChunks,
        sentTimestamp: dataChunk.timestamp,
        timestamp: startTime,
        startTime: startTime,
        receivedChunks: new Set(),
      })
    }

    const chunkData = chunkMap.get(dataChunk.messageId)!

    // chunk 저장
    chunkData.chunks.set(dataChunk.chunkIndex, dataChunk.payload)
    chunkData.receivedChunks.add(dataChunk.chunkIndex)
    chunkData.timestamp = Date.now()

    // 모든 chunk가 도착했는지 확인 (중복 제거된 실제 받은 청크 수로 확인)
    if (chunkData.receivedChunks.size !== chunkData.totalChunks) {
      return null
    }

    const completionTime = Date.now()

    // chunk들을 순서대로 조합
    const combinedData = combineChunks(chunkData)

    // PointCloud2 객체 생성
    const pointCloud = pointcloud.PointCloud2.decode(combinedData)

    const sentMs =
      typeof chunkData.sentTimestamp === "number"
        ? chunkData.sentTimestamp / 1000
        : Number(chunkData.sentTimestamp) / 1000
    const delayMs = completionTime - sentMs

    delayMeasurements.delayDatas.push(delayMs)
    delayMeasurements.numDatas += 1

    // 처리된 chunk 데이터 삭제
    chunkMap.delete(dataChunk.messageId)

    // PointCloud2 객체를 LiDARPoints 형식으로 변환
    const lidarPoints: LiDARPoints = {
      header: {
        stamp: pointCloud.header?.stamp || null,
        frameId: pointCloud.header?.frameId || null,
        messageId: dataChunk.messageId,
      },
      height: pointCloud.height,
      width: pointCloud.width,
      isBigendian: pointCloud.isBigendian,
      pointStep: pointCloud.pointStep,
      rowStep: pointCloud.rowStep,
      isDense: pointCloud.isDense,
      datas: [],
    }

    // 필드 매핑 생성: 필요한 필드들의 offset 정보를 찾음
    const requiredFields = ["x", "y", "z", "intensity"]
    const fieldMapping: Record<string, { offset: number; datatype: number }> =
      {}

    for (const field of pointCloud.fields) {
      if (
        field.name &&
        requiredFields.includes(field.name) &&
        field.offset != null &&
        field.datatype != null
      ) {
        fieldMapping[field.name] = {
          offset: field.offset,
          datatype: field.datatype,
        }
      }
    }

    // 필수 필드 존재 여부 확인
    for (const requiredField of requiredFields) {
      if (!fieldMapping[requiredField]) {
        throw new Error(
          `Required field '${requiredField}' not found in pointCloud.fields`,
        )
      }
    }

    const numPoints = pointCloud.width * pointCloud.height
    for (let i = 0; i < numPoints; i++) {
      const pointOffset = i * pointCloud.pointStep

      // 동적 필드 파싱
      const x = new Float32Array(
        pointCloud.data.slice(
          pointOffset + fieldMapping.x.offset,
          pointOffset + fieldMapping.x.offset + 4,
        ).buffer,
      )[0]

      const y = new Float32Array(
        pointCloud.data.slice(
          pointOffset + fieldMapping.y.offset,
          pointOffset + fieldMapping.y.offset + 4,
        ).buffer,
      )[0]

      const z = new Float32Array(
        pointCloud.data.slice(
          pointOffset + fieldMapping.z.offset,
          pointOffset + fieldMapping.z.offset + 4,
        ).buffer,
      )[0]

      const intensity = new Float32Array(
        pointCloud.data.slice(
          pointOffset + fieldMapping.intensity.offset,
          pointOffset + fieldMapping.intensity.offset + 4,
        ).buffer,
      )[0]

      lidarPoints.datas.push({
        x: Number.isNaN(x) ? null : x,
        y: Number.isNaN(y) ? null : y,
        z: Number.isNaN(z) ? null : z,
        intensity: Number.isNaN(intensity) ? null : intensity,
      })
    }

    return {
      ...lidarPoints,
      timestamp: completionTime,
    }
  } catch (error) {
    console.error("Error parsing data chunk:", error)
    return null
  }
}

export const LIDAR_POINTCLOUD2_TYPE = Symbol("lidar_pointcloud2")
