import type {ParsedData} from "./parsed.type"

export type ParsedGo2LowState = ParsedData<Go2LowState>

export interface Go2LowState {
  imu_state: Go2ImuStateData
  motor_state: Go2MotorStateData
  foot_force: Go2FootForceData
  foot_force_est: Go2FootForceEstData
  power_v: number
  power_a: number
}

export interface Go2ImuStateData {
  quaternion: [number, number, number, number]
  gyroscope: [number, number, number]
  accelerometer: [number, number, number]
  rpy: [number, number, number]
}

export type Go2MotorStateData = Go2MotorStateDetailsData[]

export interface Go2MotorStateDetailsData {
  q: number
  dq: number
  ddq: number
  tau_est: number
}

export type Go2FootForceData = [number, number, number, number]

export type Go2FootForceEstData = [number, number, number, number]

export const parseGo2LowState = (data: string): ParsedGo2LowState => {
  const json = JSON.parse(data)
  return {
    ...json,
    timestamp: Date.now(),
  }
}

export const GO2_LOW_STATE_TYPE = Symbol("go2_low_state")
