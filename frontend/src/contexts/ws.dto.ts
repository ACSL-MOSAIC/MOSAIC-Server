import type { RobotStatus } from "@/mosaic"

export type WsBaseMessage<T extends string = string, D = any> = {
  type: T
  data: D
}

export type WsAuthorizeDto = {
  accessToken: string
}

export type WsAuthorizeResDto = number

export type WsGetRobotListDto = Record<string, never> // 빈 객체

export type WsStatusUpdateDto = {
  robotId: string
  status: RobotStatus
}

export type WsStatusSubscribeDto = {
  robotIds: string[]
}

export type WsForceLogoutDto = {
  message: string
}

export type WsPingPongDto = {
  pingId: string
}
