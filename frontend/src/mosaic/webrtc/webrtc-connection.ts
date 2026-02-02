import type {MosaicStore} from "@/mosaic/store/interface/mosaic-store.ts"
import type {ChannelRequirement} from "@/mosaic/channel"
import type {ConnectorRequirement} from "@/mosaic/webrtc/index.ts"
import type {ReceivableStore} from "@/mosaic/store/interface/receivable-store.ts"
import type {SendableStore} from "@/mosaic/store/interface/sendable-store.ts"
import type {BidirectionalStore} from "@/mosaic/store/interface/bidirectional-store.ts"

export class WebRTCConnection {
  private rtcConnectionId: string
  private robotId: string
  private signalingServer: SignalingServer
  private peerConnection: RTCPeerConnection | null
  private dataChannels: Map<string, RTCDataChannel>
  private relatedStores: Map<string, MosaicStore>
  private mediaStreams: Map<string, MediaStream>

  public WebRTCConnection(rtcConnectionId: string, robotId: string) {
  }

  public getRtcConnectionId(): string {
  }

  public createConnection(channelRequirements: ChannelRequirement[]): void {
  }

  public startConnection(): Promise<void> {
  }

  public disconnect(): void {
  }

  public getPeerConnection(): RTCPeerConnection | null {
  }

  public receiveSdpAnswer(data): Promise<void> {
  }

  public receiveIceCandidate(data): Promise<void> {
  }

  private beforeConnection(): ConnectorRequirement[] {
  }

  private createPeerConnection(): RTCPeerConnection {
  }

  private createDataChannel(connectorId: string): RTCDataChannel {
  }

  private setupReceivableChannel(
    dc: RTCDataChannel,
    store: ReceivableStore,
  ): void {
  }

  private setupSendableChannel(
    dc: RTCDataChannel,
    store: SendableStore<any>,
  ): void {
  }

  private setupBidirectionalChannel(
    dc: RTCDataChannel,
    store: BidirectionalStore<any>,
  ): void {
  }

  private createSdpOffer(): Promise<RTCSessionDescriptionInit> {
  }

  private onicecandidate(event: RTCPeerConnectionIceEvent): void {
  }

  private onconnectionstatechange(): void {
  }

  private onConnectionConnected(): void {
  }

  private onConnectionDisconnected(): void {
  }

  private onConnectionFailed(): void {
  }

  private resolveSdpAnswer(data): RTCSessionDescriptionInit {
  }

  private resolveIceCandidate(data): RTCIceCandidate {
  }
}
