import type {
  WsAuthorizeDto,
  WsBaseMessage,
  WsForceLogoutDto,
  WsGetRobotListDto,
  WsPingPongDto,
  WsRobotListDto,
} from "@/contexts/ws.dto.ts"
import type {
  WsReceiveIceCandidateDto,
  WsReceiveSdpAnswerDto,
  WsReceiveSdpOfferDto,
  WsSendClosePeerConnectionDto,
  WsSendIceCandidateDto,
  WsSendSdpAnswerDto,
  WsSendSdpOfferDto,
} from "@/mosaic/webrtc/signaling.dto.ts"
import {createContext} from "react"

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
  | WsBaseMessage<"ping.ping", WsPingPongDto>
  | WsBaseMessage<"ping.pong", WsPingPongDto>

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
