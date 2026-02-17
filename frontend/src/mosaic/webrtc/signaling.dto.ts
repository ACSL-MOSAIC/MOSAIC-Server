export type WsSendSdpOfferDto = {
  rtcConnectionId: string
  sdpOffer: string
}

export type WsSendSdpAnswerDto = {
  rtcConnectionId: string
  sdpAnswer: string
}

export type IceCandidate = {
  candidate: string
  sdpMid: string | null
  sdpMLineIndex: number | null
}

export type WsExchangeIceCandidateDto = {
  rtcConnectionId: string
  iceCandidate: IceCandidate
}

export type WsClosePeerConnectionDto = {
  rtcConnectionId: string
}
