export const ROBOT_STATUSES = [
  { value: 0, label: "Ready to Connect" },
  { value: 1, label: "RTC Connecting" },
  { value: 2, label: "RTC Connected" },
  { value: 3, label: "RTC Disconnecting" },
  { value: 4, label: "RTC Failed" },
  { value: 5, label: "Disconnected" },
  { value: 6, label: "WS Connected" },
] as const

export type RobotStatus = typeof ROBOT_STATUSES[number]['value']

export const ROBOT_AUTH_TYPES = [
  { value: 0, label: "No Authorization" },
  { value: 1, label: "Simple Token" },
] as const

export type RobotAuthType = typeof ROBOT_AUTH_TYPES[number]['value']

export type RobotInfoDto = {
  id: string
  name: string
  description: string
  status: RobotStatus
  authType: RobotAuthType
  organizationId: string
}

export type RobotAddDto = {
  name: string
  description: string
  status: RobotStatus
  authType: RobotAuthType
}

export type RobotUpdateDto = {
  name?: string | null
  description?: string | null
  status?: RobotStatus | null
  authType?: RobotAuthType | null
}
