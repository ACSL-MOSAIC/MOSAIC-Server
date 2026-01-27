import type {ParsedData} from "./parsed.type"

export const TURTLESIM_POSITION_TYPE = Symbol("turtlesim_position")

export type ParsedTurtlesimPosition = ParsedData<TurtlesimPosition>

export interface TurtlesimPosition {
  x: number
  y: number
  theta: number
}

export const parseTurtlesimPosition = (
  data: string,
): ParsedTurtlesimPosition | null => {
  try {
    const json = JSON.parse(data)

    // 필수 필드 검증
    if (
      typeof json.x !== "number" ||
      typeof json.y !== "number" ||
      typeof json.theta !== "number"
    ) {
      console.warn("Invalid turtlesim position data format:", json)
      return null
    }

    return {
      x: json.x,
      y: json.y,
      theta: json.theta,
      timestamp: Date.now(),
    }
  } catch (error) {
    console.error("Error parsing turtlesim position data:", error)
    return null
  }
}
