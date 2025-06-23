import { ParsedData } from "./parsed.type"
import { VideoData } from "./video-data"

export const TURTLESIM_VIDEO_TYPE = Symbol('TURTLESIM_VIDEO_TYPE')

export type ParsedTurtlesimVideo = ParsedData<TurtlesimVideo>

export interface TurtlesimVideo extends VideoData {}

export function parseTurtlesimVideo(data: any): ParsedTurtlesimVideo | null {
  try {
    console.log('터틀비디오 파서 입력 데이터:', data)
    
    // JSON 문자열인 경우 파싱
    let parsedData = data
    if (typeof data === 'string') {
      try {
        parsedData = JSON.parse(data)
        console.log('터틀비디오 파서 JSON 파싱 결과:', parsedData)
      } catch (jsonError) {
        console.error('JSON 파싱 실패:', jsonError)
        return null
      }
    }
    
    // 기본 VideoData 파싱
    const baseVideoData = {
      streamId: parsedData.streamId || 'unknown',
      robotId: parsedData.robotId || 'unknown',
      channelLabel: parsedData.channelLabel || 'turtlesim_video',
      fps: parsedData.fps || 0,
      resolution: {
        width: parsedData.width || 640,
        height: parsedData.height || 480
      },
      isActive: parsedData.isActive || false
    }

    console.log('터틀비디오 파서 파싱 결과:', baseVideoData)

    // 터틀심 특화 필드 파싱
    const turtlesimVideo: TurtlesimVideo = {
      ...baseVideoData,
    }

    const result = {
      ...turtlesimVideo,
      timestamp: Date.now()
    }
    
    console.log('터틀비디오 파서 최종 결과:', result)
    return result
  } catch (error) {
    console.error('Error parsing turtlesim video stream:', error)
    return null
  }
} 