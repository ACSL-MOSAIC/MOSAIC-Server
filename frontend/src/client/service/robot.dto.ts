export type RobotCreate = {
  id: string
  name: string
  description?: string | null
}

export type RobotPublic = {
  name: string
  description?: string | null
  status: RobotStatus
  id: string
  owner_id: string
}

export type RobotsPublic = {
  data: Array<RobotPublic>
  count: number
}

export type RobotStatus = number

export type RobotUpdate = {
  name?: string | null
  description?: string | null
  status?: RobotStatus | null
}
