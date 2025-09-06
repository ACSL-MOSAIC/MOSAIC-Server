import {
  type ParsedPointCloud2,
  parsePointCloud2,
} from "../../../parser/lidar-pointcloud.ts"
import { ReadOnlyStore } from "./read-only-store"

export interface DelayMeasurement {
  delayDatas: number[]
  numDatas: number
}

export class LidarPointCloudStore extends ReadOnlyStore<
  ParsedPointCloud2,
  ArrayBuffer
> {
  // FPS 측정을 위한 변수들
  public fps: number = 0
  private frameTimestamps: number[] = []
  private readonly MAX_FRAME_HISTORY = 10
  private lastFpsLogTime = 0
  private readonly FPS_LOG_INTERVAL = 1000

  // Delay 측정을 위한 변수들
  private delayMeasurements: DelayMeasurement = {
    delayDatas: [],
    numDatas: 0,
  }

  constructor(robotId: string) {
    const parser = (buffer: ArrayBuffer) => this.parsePointCloud2WithFpsAndDelayLog(buffer)
    super(robotId, 100, parser)
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
  private logFPS(): void {
    const now = Date.now()
    if (now - this.lastFpsLogTime >= this.FPS_LOG_INTERVAL) {
      this.fps = this.calculateFPS()
      console.log(
        `📊 PointCloud FPS: ${this.fps.toFixed(1)} (based on last ${Math.min(this.frameTimestamps.length, this.MAX_FRAME_HISTORY)} frames)`,
      )
      console.log("Delay measurements (ms):", this.delayMeasurements)
      this.lastFpsLogTime = now
    }
  }

  parsePointCloud2WithFpsAndDelayLog(buffer: ArrayBuffer): ParsedPointCloud2 | null {
    const result = parsePointCloud2(buffer, this.delayMeasurements)

    if (result) {
      // FPS 측정을 위한 타임스탬프 추가
      this.frameTimestamps.push(result.timestamp)
      if (this.frameTimestamps.length > this.MAX_FRAME_HISTORY) {
        this.frameTimestamps.shift()
      }

      // FPS 로그 출력 (1초마다)
      this.logFPS()
    }

    return result
  }
}
