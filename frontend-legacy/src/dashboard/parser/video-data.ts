import type {ParsedData} from "./parsed.type"

export const VIDEO_TYPE = Symbol("VIDEO_TYPE")

export type ParsedVideoData = ParsedData<VideoData>

export interface VideoData {
  streamId: string
  robotId: string
  channelLabel: string
  fps: number
  resolution: {
    width: number
    height: number
  }
  isActive: boolean
}

export function parseVideoData(data: any): ParsedVideoData | null {
  try {
    return {
      streamId: data.streamId || "unknown",
      robotId: data.robotId || "unknown",
      channelLabel: data.channelLabel || "unknown",
      fps: data.fps || 0,
      resolution: {
        width: data.width || 640,
        height: data.height || 480,
      },
      isActive: data.isActive || false,
      timestamp: Date.now(),
    }
  } catch (error) {
    console.error("Error parsing video data:", error)
    return null
  }
}
