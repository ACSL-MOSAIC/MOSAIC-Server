import {createContext} from "react"

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

export type WsGetRobotListDto = Record<string, never> // 빈 객체

export type WsRobotListDto = {
  robots: RobotInfo[]
}

export type WsSendSdpOfferDto = {
  robot_id: string
  sdp_offer: string
}

export type WsReceiveSdpOfferDto = {
  user_id: string
  robot_id: string
  sdp_offer: string
}

export type WsSendSdpAnswerDto = {
  user_id: string
  robot_id: string
  sdp_answer: string
}

export type WsReceiveSdpAnswerDto = {
  user_id: string
  robot_id: string
  sdp_answer: string
}

export type IceCandidate = {
  candidate: string
  sdpMid: string | null
  sdpMLineIndex: number | null
}

export type WsSendIceCandidateDto = {
  robot_id: string
  ice_candidate: IceCandidate
}

export type WsReceiveIceCandidateDto = {
  user_id: string
  robot_id: string
  ice_candidate: IceCandidate
}

export type WsSendClosePeerConnectionDto = {
  robot_id: string
}

export type WsForceLogoutDto = {
  message: string
}

export type WsPingDto = {
  pingId: string
}

export type WsPongDto = {
  pingId: string
}

export type WsMessages =
  | WsBaseMessage<"authorize.req", void>
  | WsBaseMessage<"authorize", WsAuthorizeDto>
  | WsBaseMessage<"get_robot_list", WsGetRobotListDto>
  | WsBaseMessage<"robot_list", WsRobotListDto>
  | WsBaseMessage<"send_sdp_offer", WsSendSdpOfferDto>
  | WsBaseMessage<"receive_sdp_offer", WsReceiveSdpOfferDto>
  | WsBaseMessage<"send_sdp_answer", WsSendSdpAnswerDto>
  | WsBaseMessage<"receive_sdp_answer", WsReceiveSdpAnswerDto>
  | WsBaseMessage<"send_ice_candidate", WsSendIceCandidateDto>
  | WsBaseMessage<"receive_ice_candidate", WsReceiveIceCandidateDto>
  | WsBaseMessage<"send_close_peer_connection", WsSendClosePeerConnectionDto>
  | WsBaseMessage<"force_logout", WsForceLogoutDto>
  | WsBaseMessage<"ping.ping", WsPingDto>
  | WsBaseMessage<"ping.pong", WsPongDto>

export type ExtractMessageByType<T extends WsMessages["type"]> = Extract<
  WsMessages,
  { type: T }
>

export type ExtractDataByType<T extends WsMessages["type"]> =
  ExtractMessageByType<T>["data"]

export interface WebSocketContextType {
  sendMessage: (message: WsMessages) => void
  onMessage: <T extends WsMessages["type"]>(
    type: T,
    callback: (data: ExtractDataByType<T>) => void | Promise<void>,
  ) => () => void

  disconnect: () => void
}

export const WebSocketContext = createContext<WebSocketContextType | null>(null)
