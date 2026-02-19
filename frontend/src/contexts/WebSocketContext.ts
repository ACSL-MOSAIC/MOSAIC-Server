import type {
  WsAuthorizeDto,
  WsAuthorizeResDto,
  WsBaseMessage,
  WsForceLogoutDto,
  WsGetRobotListDto,
  WsPingPongDto,
  WsRobotListDto,
  WsStatusUpdateDto,
} from "@/contexts/ws.dto.ts"
import type {
  WsClosePeerConnectionDto,
  WsExchangeIceCandidateDto,
  WsSendSdpAnswerDto,
  WsSendSdpOfferDto,
} from "@/mosaic/webrtc/signaling.dto.ts"
import {createContext} from "react"

export type WsMessages =
  | WsBaseMessage<"ping.ping", WsPingPongDto>
  | WsBaseMessage<"ping.pong", WsPingPongDto>
  | WsBaseMessage<"authorize.req", void>
  | WsBaseMessage<"authorize", WsAuthorizeDto>
  | WsBaseMessage<"authorize.res", WsAuthorizeResDto>
  | WsBaseMessage<"signaling.send_sdp_offer", WsSendSdpOfferDto>
  | WsBaseMessage<"signaling.send_sdp_answer", WsSendSdpAnswerDto>
  | WsBaseMessage<"signaling.exchange_ice_candidate", WsExchangeIceCandidateDto>
  | WsBaseMessage<"signaling.close_connection", WsClosePeerConnectionDto>
  | WsBaseMessage<"get_robot_list", WsGetRobotListDto>
  | WsBaseMessage<"robot_list", WsRobotListDto>
  | WsBaseMessage<"status.update", WsStatusUpdateDto>
  | WsBaseMessage<"force_logout", WsForceLogoutDto>

export type ExtractMessageByType<T extends WsMessages["type"]> = Extract<
  WsMessages,
  { type: T }
>

export type ExtractDataByType<T extends WsMessages["type"]> =
  ExtractMessageByType<T>["data"]

export type SendWsMessageType = (message: WsMessages) => void

export type OnWsMessageType = <T extends WsMessages["type"]>(
  type: T,
  callback: (data: ExtractDataByType<T>) => void | Promise<void>,
) => () => void

export interface WebSocketContextType {
  sendWsMessage: SendWsMessageType
  onWsMessage: OnWsMessageType
  disconnectWs: () => void
}

export const WebSocketContext = createContext<WebSocketContextType | null>(null)
