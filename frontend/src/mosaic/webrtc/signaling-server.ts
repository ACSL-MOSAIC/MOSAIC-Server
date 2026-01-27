import type {WebRTCConnection} from "@/mosaic/webrtc/webrtc-connection.ts"

class SignalingServer {
  private ws: WebSocket | null
  private rtcConnections: Map<string, WebRTCConnection>

  public SignalingServer() {
  }

  public setRtcConnection(rtcConnection: WebRTCConnection): void {
  }

  public sendSdpOffer(
    rtcConnectionId: string,
    offer: RTCSessionDescriptionInit,
  ): Promise<void> {
  }

  public sendIceCandidate(
    rtcConnectionId: string,
    candidate: RTCIceCandidate,
  ): Promise<void> {
  }

  public sendCloseConnection(rtcConnectionId: string): Promise<void> {
  }

  public receiveSdpAnswer(data): Promise<void> {
  }

  public receiveIceCandidate(data): Promise<void> {
  }
}
