export type RobotSessionDto = {
  robotId: string
  rtcSessionId: string
}

export type WebRTCConnectionReqDto = {
  robotIds: string[]
}

export type WebRTCConnectionResDto = {
  sessions: RobotSessionDto[]
}

export type IceServerDto = {
  urls: string
  username?: string | null
  credential?: string | null
}
