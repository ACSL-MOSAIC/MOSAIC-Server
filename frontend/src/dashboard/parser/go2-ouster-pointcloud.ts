import type { ParsedData } from "./parsed.type"
import { chunking, pointcloud } from "./protobuf/proto"

interface ChunkData {
  messageId: string
  chunks: Map<number, Uint8Array>
  totalChunks: number
  timestamp: number
  startTime: number // 첫 번째 청크 도착 시간
  receivedChunks: Set<number> // 실제로 받은 청크 인덱스 추적
}

// 전역 chunkMap과 cleanup 타이머
const chunkMap: Map<string, ChunkData> = new Map()
const CHUNK_TIMEOUT = 5000 // 5초
const MAX_CONCURRENT_MESSAGES = 3 // 최대 2개의 메시지 동시 처리

// FPS 측정을 위한 전역 변수들
const frameTimestamps: number[] = []
const MAX_FRAME_HISTORY = 10 // 최근 10개 프레임으로 FPS 계산
let lastFpsLogTime = 0
const FPS_LOG_INTERVAL = 1000 // 1초마다 FPS 로그 출력

// 주기적으로 오래된 chunk 데이터 정리
setInterval(() => {
  const now = Date.now()
  for (const [messageId, chunkData] of chunkMap.entries()) {
    if (now - chunkData.timestamp > CHUNK_TIMEOUT) {
      chunkMap.delete(messageId)
    }
  }
}, CHUNK_TIMEOUT)

// FPS 계산 함수
const calculateFPS = (): number => {
  if (frameTimestamps.length < 2) return 0

  const recentFrames = frameTimestamps.slice(-MAX_FRAME_HISTORY)
  const totalTime = recentFrames[recentFrames.length - 1] - recentFrames[0]
  const frameCount = recentFrames.length - 1

  return totalTime > 0 ? (frameCount / totalTime) * 1000 : 0
}

// FPS 로그 출력 함수
const logFPS = (): void => {
  const now = Date.now()
  if (now - lastFpsLogTime >= FPS_LOG_INTERVAL) {
    const fps = calculateFPS()
    console.log(
      `📊 PointCloud FPS: ${fps.toFixed(1)} (based on last ${Math.min(frameTimestamps.length, MAX_FRAME_HISTORY)} frames)`,
    )
    lastFpsLogTime = now
  }
}

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

export type ParsedPointCloud2 = ParsedData<pointcloud.IPointCloud2>

export const parsePointCloud2 = (
  buffer: ArrayBuffer,
): ParsedPointCloud2 | null => {
  try {
    const dataChunk = chunking.DataChunk.decode(new Uint8Array(buffer))
    return parsePointCloud2FromDataChunk(dataChunk)
  } catch (error) {
    console.error("❌ Error decoding data chunk:", error)
    return null
  }
}

export const parsePointCloud2FromDataChunk = (
  dataChunk: chunking.DataChunk,
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
        console.log(
          `Removed oldest message: ${oldestMessageId} to make room for: ${dataChunk.messageId}`,
        )
      }

      const startTime = Date.now()
      chunkMap.set(dataChunk.messageId, {
        messageId: dataChunk.messageId,
        chunks: new Map(),
        totalChunks: dataChunk.totalChunks,
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

    // 청크 진행 상황 로그
    const progress = (
      (chunkData.receivedChunks.size / chunkData.totalChunks) *
      100
    ).toFixed(1)
    // 모든 chunk가 도착했는지 확인 (중복 제거된 실제 받은 청크 수로 확인)
    if (chunkData.receivedChunks.size === chunkData.totalChunks) {
      const completionTime = Date.now()
      const reassemblyTime = completionTime - chunkData.startTime

      // chunk들을 순서대로 조합
      const combinedData = combineChunks(chunkData)

      // PointCloud2 객체 생성
      const pointCloud = pointcloud.PointCloud2.decode(combinedData)

      // 처리된 chunk 데이터 삭제
      chunkMap.delete(dataChunk.messageId)

      // FPS 측정을 위한 타임스탬프 추가
      frameTimestamps.push(completionTime)
      if (frameTimestamps.length > MAX_FRAME_HISTORY) {
        frameTimestamps.shift()
      }

      // PointCloud2 객체를 ParsedPointCloud2로 변환
      const parsedPointCloud: ParsedPointCloud2 = {
        ...pointCloud.toJSON(),
        timestamp: completionTime,
      } as any

      // 메시지 ID 추가 (타입 안전성을 위해 any 사용)
      ;(parsedPointCloud as any).messageId = dataChunk.messageId

      // FPS 로그 출력 (1초마다)
      logFPS()

      return parsedPointCloud
    }

    return null
  } catch (error) {
    console.error("Error parsing data chunk:", error)
    return null
  }
}

export const GO2_OUSTER_POINTCLOUD2_TYPE = Symbol("go2_ouster_pointcloud2")
