import { ParsedData } from "./parsed.type"

export const TURTLESIM_REMOTE_CONTROL_TYPE = Symbol('TURTLESIM_REMOTE_CONTROL_TYPE')

export type ParsedTurtlesimRemoteControl = ParsedData<TurtlesimRemoteControl>

export interface TurtlesimRemoteControl {
  direction: 'up' | 'down' | 'left' | 'right'
  timestamp?: number
}

export const parseTurtlesimRemoteControl = (data: string): ParsedTurtlesimRemoteControl | null => {
  try {
    const json = JSON.parse(data)
    
    // 필수 필드 검증
    if (!json.direction || !['up', 'down', 'left', 'right'].includes(json.direction)) {
      console.warn('Invalid turtlesim remote control data format:', json)
      return null
    }
    
    return {
      direction: json.direction,
      timestamp: json.timestamp || Date.now()
    }
  } catch (error) {
    console.error('Error parsing turtlesim remote control data:', error)
    return null
  }
} 