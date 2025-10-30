import type {ParsedData} from "./parsed.type"

export const VIDEO_RECORDING_TYPE = Symbol("VIDEO_RECORDING_TYPE")

export type ParsedVideoRecordingCommand = ParsedData<VideoRecordingCommand>
export type VideoRecordingCommandType = "start" | "stop" | "pause" | "resume"

export interface VideoRecordingCommand {
  command: VideoRecordingCommandType
  timestamp: number
}

export function parseVideoRecordingCommand(
  data: string,
): ParsedData<VideoRecordingCommand> | null {
  try {
    const json = JSON.parse(data)
    return {
      command: json.command,
      timestamp: json.timestamp || Date.now(),
    }
  } catch (error) {
    console.error("Failed to parse video recording command data:", error)
    return null
  }
}
