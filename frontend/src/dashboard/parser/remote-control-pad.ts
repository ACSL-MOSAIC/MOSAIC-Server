import type {ParsedData} from "./parsed.type"

export const REMOTE_CONTROL_PAD_TYPE = Symbol("REMOTE_CONTROL_PAD_TYPE")

export type ParsedRemoteControl = ParsedData<RemoteControlPad>

export interface RemoteControlPad {
  direction: "up" | "down" | "left" | "right" | "stop"
  timestamp?: number
}

export const parseRemoteControl = (
  data: string,
): ParsedRemoteControl | null => {
  try {
    const json = JSON.parse(data)

    // 필수 필드 검증
    if (
      !json.direction ||
      !["up", "down", "left", "right", "stop"].includes(json.direction)
    ) {
      console.warn("Invalid remote control data format:", json)
      return null
    }

    return {
      direction: json.direction,
      timestamp: json.timestamp || Date.now(),
    }
  } catch (error) {
    console.error("Error parsing remote control data:", error)
    return null
  }
}
