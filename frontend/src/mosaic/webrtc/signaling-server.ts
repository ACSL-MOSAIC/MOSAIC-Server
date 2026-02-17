import type {
  OnWsMessageType,
  SendWsMessageType,
} from "@/contexts/WebSocketContext.ts"
import type {
  WsExchangeIceCandidateDto,
  WsSendSdpAnswerDto,
} from "@/mosaic/webrtc/signaling.dto.ts"
import type {WebRTCConnection} from "@/mosaic/webrtc/webrtc-connection.ts"

export class SignalingServer {
  private readonly sendWsMessage: SendWsMessageType
  private readonly onWsMessage: OnWsMessageType
  private rtcConnections: Map<string, WebRTCConnection> // rtcConnectionId -> WebRTCConnection

  constructor(sendWsMessage: SendWsMessageType, onWsMessage: OnWsMessageType) {
    this.sendWsMessage = sendWsMessage
    this.onWsMessage = onWsMessage
    this.rtcConnections = new Map()
    this.registerSignalingWsMessageListener()
  }

  // TODO: when does this method called?
  public setRtcConnection(rtcConnection: WebRTCConnection): void {
    // TODO: what if rtcConnectionId already exists?
    this.rtcConnections.set(rtcConnection.rtcConnectionId, rtcConnection)
    rtcConnection.signalingServer = this
  }

  public sendSdpOffer(
    rtcConnectionId: string,
    offer: RTCSessionDescriptionInit,
  ): void {
    if (!offer.sdp) {
      throw new Error("SDP offer is missing")
    }

    this.sendWsMessage({
      type: "signaling.send_sdp_offer",
      data: {
        rtcConnectionId: rtcConnectionId,
        sdpOffer: offer.sdp,
      },
    })
  }

  public sendIceCandidate(
    rtcConnectionId: string,
    candidate: RTCIceCandidate,
  ): void {
    this.sendWsMessage({
      type: "signaling.exchange_ice_candidate",
      data: {
        rtcConnectionId: rtcConnectionId,
        iceCandidate: {
          candidate: candidate.candidate,
          sdpMid: candidate.sdpMid,
          sdpMLineIndex: candidate.sdpMLineIndex,
        },
      },
    })
  }

  public sendCloseConnection(rtcConnectionId: string): void {
    this.sendWsMessage({
      type: "signaling.close_connection",
      data: {rtcConnectionId: rtcConnectionId},
    })
  }

  private async receiveIceCandidate(
    data: WsExchangeIceCandidateDto,
  ): Promise<void> {
    const {rtcConnectionId, iceCandidate} = data
    const webRtcConnection = this.rtcConnections.get(rtcConnectionId)
    if (!webRtcConnection) {
      console.warn("Received ICE candidate for unknown WebRTC connection")
      return
    }
    await webRtcConnection.receiveIceCandidate(iceCandidate)
  }

  private async receiveSdpAnswer(data: WsSendSdpAnswerDto): Promise<void> {
    const {rtcConnectionId, sdpAnswer} = data
    const webRtcConnection = this.rtcConnections.get(rtcConnectionId)
    if (!webRtcConnection) {
      console.warn("Received SDP answer for unknown WebRTC connection")
      return
    }
    await webRtcConnection.receiveSdpAnswer(sdpAnswer)
  }

  private registerSignalingWsMessageListener(): void {
    this.onWsMessage(
      "signaling.send_sdp_answer",
      async (data: WsSendSdpAnswerDto) => {
        await this.receiveSdpAnswer(data)
      },
    )
    this.onWsMessage(
      "signaling.exchange_ice_candidate",
      async (data: WsExchangeIceCandidateDto) => {
        await this.receiveIceCandidate(data)
      },
    )
  }
}
