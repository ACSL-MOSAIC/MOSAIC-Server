import {
  createContext,
} from "react"

// 로봇 정보 타입
export interface RobotInfo {
  robot_id: string
  state: string
}

// 기본 메시지 타입
export interface WebSocketBaseMessage {
  type: string
}

export interface AuthorizeMessage extends WebSocketBaseMessage {
  type: "authorize"
  data: {
    accessToken: string
  }
}

// 로봇 리스트 요청/응답 타입
export interface GetRobotListMessage extends WebSocketBaseMessage {
  type: "get_robot_list"
}

export interface RobotListMessage extends WebSocketBaseMessage {
  type: "robot_list"
  robots: RobotInfo[]
}

// SDP Offer/Answer 타입
export interface SendSdpOfferMessage extends WebSocketBaseMessage {
  type: "send_sdp_offer"
  robot_id: string
  sdp_offer: string
}

export interface ReceiveSdpOfferMessage extends WebSocketBaseMessage {
  type: "receive_sdp_offer"
  user_id: string
  robot_id: string
  sdp_offer: string
}

export interface SendSdpAnswerMessage extends WebSocketBaseMessage {
  type: "send_sdp_answer"
  user_id: string
  robot_id: string
  sdp_answer: string
}

export interface ReceiveSdpAnswerMessage extends WebSocketBaseMessage {
  type: "receive_sdp_answer"
  user_id: string
  robot_id: string
  sdp_answer: string
}

// ICE Candidate 타입
export interface SendIceCandidateMessage extends WebSocketBaseMessage {
  type: "send_ice_candidate"
  robot_id: string
  ice_candidate: {
    candidate: string
    sdpMid: string | null
    sdpMLineIndex: number | null
  }
}

export interface ReceiveIceCandidateMessage extends WebSocketBaseMessage {
  type: "receive_ice_candidate"
  user_id: string
  robot_id: string
  ice_candidate: {
    candidate: string
    sdpMid: string | null
    sdpMLineIndex: number | null
  }
}

export interface SendClosePeerConnectionMessage extends WebSocketBaseMessage {
  type: "send_close_peer_connection"
  robot_id: string
}

export interface ForceLogoutMessage extends WebSocketBaseMessage {
  type: "force_logout"
  message: string
}

// 모든 메시지 타입을 유니온 타입으로 정의
export type WebSocketMessage =
  | AuthorizeMessage
  | GetRobotListMessage
  | RobotListMessage
  | SendSdpOfferMessage
  | ReceiveSdpOfferMessage
  | SendSdpAnswerMessage
  | ReceiveSdpAnswerMessage
  | SendIceCandidateMessage
  | ReceiveIceCandidateMessage
  | SendClosePeerConnectionMessage
  | ForceLogoutMessage

export interface WebSocketContextType {
  robots: RobotInfo[]
  sendMessage: (message: WebSocketMessage) => void
  onMessage: <T extends WebSocketMessage>(
    type: T["type"],
    callback: (data: T) => void,
  ) => () => void
  disconnect: () => void
}

export const WebSocketContext = createContext<WebSocketContextType | null>(null)
