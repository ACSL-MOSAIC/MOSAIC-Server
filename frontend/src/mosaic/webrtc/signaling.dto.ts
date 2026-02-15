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
