import {
  type ChunkData,
  type ParsedPointCloud2,
  parsePointCloud2,
} from "../../../parser/lidar-pointcloud.ts"
import {ReadOnlyStore} from "./read-only-store"

export interface DelayMeasurement {
  delayDatas: number[]
  numDatas: number
}

const CHUNK_TIMEOUT = 5000 // 5초

export class LidarPointCloudStore extends ReadOnlyStore<
  ParsedPointCloud2,
  ArrayBuffer
> {
  // FPS 측정을 위한 변수들
  public fps = 0
  private fpsDatas: number[] = []
  private frameTimestamps: number[] = []
  private readonly MAX_FRAME_HISTORY = 10
  private lastFpsLogTime = 0
  private readonly FPS_LOG_INTERVAL = 1000

  private chunkMap: Map<string, ChunkData> = new Map()

  // Delay 측정을 위한 변수들
  private delayMeasurements: DelayMeasurement = {
    delayDatas: [],
    numDatas: 0,
  }

  constructor(robotId: string) {
    const parser = (buffer: ArrayBuffer) =>
      this.parsePointCloud2WithFpsAndDelayLog(buffer)
    super(robotId, 0, parser)
    this.robotId = robotId

    // 주기적으로 오래된 chunk 데이터 정리
    setInterval(() => {
      const now = Date.now()
      for (const [messageId, chunkData] of this.chunkMap.entries()) {
        if (now - chunkData.timestamp > CHUNK_TIMEOUT) {
          this.chunkMap.delete(messageId)
        }
      }
    }, CHUNK_TIMEOUT)
  }

  public cleanupDataChannel() {
    super.cleanupDataChannel()
    this.logStats()

    this.chunkMap.clear()
    this.frameTimestamps = []
    this.fpsDatas = []
    this.delayMeasurements = {delayDatas: [], numDatas: 0}
  }

  // FPS 계산 함수
  private calculateFPS(): number {
    if (this.frameTimestamps.length < 2) return 0

    const recentFrames = this.frameTimestamps.slice(-this.MAX_FRAME_HISTORY)
    const totalTime = recentFrames[recentFrames.length - 1] - recentFrames[0]
    const frameCount = recentFrames.length - 1

    return totalTime > 0 ? (frameCount / totalTime) * 1000 : 0
  }

  // FPS 로그 출력 함수
  logFPS(): void {
    const now = Date.now()
    if (now - this.lastFpsLogTime >= this.FPS_LOG_INTERVAL) {
      this.fps = this.calculateFPS()
      // this.fpsDatas.push(this.fps)
      this.lastFpsLogTime = now
    }
  }

  logStats(): void {
    console.log(
      "RobotID: ",
      this.robotId,
      "PointCloud Delay (ms):",
      this.delayMeasurements,
      "FPS:",
      this.fpsDatas,
    )
  }

  parsePointCloud2WithFpsAndDelayLog(
    buffer: ArrayBuffer,
  ): ParsedPointCloud2 | null {
    const result = parsePointCloud2(
      buffer,
      this.delayMeasurements,
      this.chunkMap,
    )

    if (result) {
      // FPS 측정을 위한 타임스탬프 추가
      this.frameTimestamps.push(result.timestamp)
      if (this.frameTimestamps.length > this.MAX_FRAME_HISTORY) {
        this.frameTimestamps.shift()
      }

      // FPS 로그 계산
      this.logFPS()
    }

    return result
  }
}
