import { createContext } from "react";

import type {
  WsAuthorizeDto,
  WsAuthorizeResDto,
  WsBaseMessage,
  WsForceLogoutDto,
  WsGetRobotListDto,
  WsPingPongDto,
  WsStatusSubscribeDto,
  WsStatusUpdateDto,
} from "@/contexts/ws.dto.ts";
import type {
  WsClosePeerConnectionDto,
  WsExchangeIceCandidateDto,
  WsSendSdpAnswerDto,
  WsSendSdpOfferDto,
} from "@/mosaic/webrtc/signaling.dto.ts";

export type WsMessages =
  | WsBaseMessage<"ping.ping", WsPingPongDto>
  | WsBaseMessage<"ping.pong", WsPingPongDto>
  | WsBaseMessage<"authorize.req", void>
  | WsBaseMessage<"authorize", WsAuthorizeDto>
  | WsBaseMessage<"authorize.res", WsAuthorizeResDto>
  | WsBaseMessage<"signaling.send_sdp_offer", WsSendSdpOfferDto>
  | WsBaseMessage<"signaling.send_sdp_answer", WsSendSdpAnswerDto>
  | WsBaseMessage<"signaling.exchange_ice_candidate", WsExchangeIceCandidateDto>
  | WsBaseMessage<"signaling.close_peer_connection", WsClosePeerConnectionDto>
  | WsBaseMessage<"get_robot_list", WsGetRobotListDto>
  | WsBaseMessage<"status.update", WsStatusUpdateDto>
  | WsBaseMessage<"status.subscribe", WsStatusSubscribeDto>
  | WsBaseMessage<"status.unsubscribe", WsStatusSubscribeDto>
  | WsBaseMessage<"force_logout", WsForceLogoutDto>;

export type ExtractMessageByType<T extends WsMessages["type"]> = Extract<WsMessages, { type: T }>;

export type ExtractDataByType<T extends WsMessages["type"]> = ExtractMessageByType<T>["data"];

export type SendWsMessageType = (message: WsMessages) => void;

export type OnWsMessageType = <T extends WsMessages["type"]>(
  type: T,
  callback: (data: ExtractDataByType<T>) => void | Promise<void>,
) => () => void;

export interface WebSocketContextType {
  sendWsMessage: SendWsMessageType;
  onWsMessage: OnWsMessageType;
  disconnectWs: () => void;
}

export const WebSocketContext = createContext<WebSocketContextType | null>(null);
