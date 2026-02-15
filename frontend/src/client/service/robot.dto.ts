import type {RobotStatus} from "@/mosaic"

export const ROBOT_AUTH_TYPES = [
  {value: 0, label: "No Authorization"},
  {value: 1, label: "Simple Token"},
] as const

export type RobotAuthType = (typeof ROBOT_AUTH_TYPES)[number]["value"]

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
  connectorConfig: string
}

export type RobotUpdateDto = {
  name?: string | null
  description?: string | null
  status?: RobotStatus | null
  authType?: RobotAuthType | null
  connectorConfig?: string | null
}

export type RobotConfigDto = {
  connectorConfig: string
}
