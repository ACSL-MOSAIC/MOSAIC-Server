export interface RobotInfo {
  robot_id: string
  state: string
}

export type WsBaseMessage<T extends string = string, D = any> = {
  type: T
  data: D
}

export type WsAuthorizeDto = {
  accessToken: string
}

export type WsAuthorizeResDto = number

export type WsGetRobotListDto = Record<string, never> // 빈 객체

export type WsRobotListDto = {
  robots: RobotInfo[]
}

export type WsForceLogoutDto = {
  message: string
}

export type WsPingPongDto = {
  pingId: string
}
