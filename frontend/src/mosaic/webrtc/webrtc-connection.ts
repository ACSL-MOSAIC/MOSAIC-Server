import type {RobotConnector} from "@/mosaic"
import type {ChannelRequirement} from "@/mosaic/channel"
import type {BidirectionalStore} from "@/mosaic/store/interface/bidirectional-store.ts"
import type {MosaicStore} from "@/mosaic/store/interface/mosaic-store.ts"
import type {ReceivableStore} from "@/mosaic/store/interface/receivable-store.ts"
import type {SendableStore} from "@/mosaic/store/interface/sendable-store.ts"
import type {ConnectorRequirement} from "@/mosaic/webrtc/index.ts"
import type {SignalingServer} from "@/mosaic/webrtc/signaling-server.ts"
import type {IceCandidate} from "@/mosaic/webrtc/signaling.dto.ts"

export class WebRTCConnection {
  private readonly _rtcConnectionId: string
  private readonly robotId: string
  private peerConnection: RTCPeerConnection | null
  private iceServers: RTCIceServer[] = []
  private channelRequirements: ChannelRequirement[] = []
  private connectorRequirements: ConnectorRequirement[] = []
  private relatedStores: MosaicStore[] = []
  private dataChannels: Map<string, RTCDataChannel> = new Map()
  private mediaStreams: Map<string, MediaStream> = new Map()
  private _signalingServer: SignalingServer | null = null
  // disconnected 이벤트와 수동 disconnect가 모두 호출되었을 때 중복 호출 방지
  private isDisconnectedNotified = false

  constructor(
    rtcConnectionId: string,
    robotId: string,
    iceServers: RTCIceServer[],
  ) {
    this._rtcConnectionId = rtcConnectionId
    this.robotId = robotId
    this.iceServers = [...iceServers]
    this.peerConnection = null
  }

  get rtcConnectionId(): string {
    return this._rtcConnectionId
  }

  set signalingServer(value: SignalingServer) {
    this._signalingServer = value
  }

  public createConnection(channelRequirements: ChannelRequirement[]): void {
    this.isDisconnectedNotified = false
    this.channelRequirements = channelRequirements

    this.beforeConnection()
    this.peerConnection = this.createPeerConnection()
    this.setupConnectors()
  }

  public async startConnection(): Promise<void> {
    if (!this.peerConnection) {
      return Promise.reject("Peer connection is not initialized yet!")
    }
    if (!this._signalingServer) {
      return Promise.reject("Signaling server is not initialized yet!")
    }

    const sdpOffer = await this.createSdpOffer()
    await this.peerConnection.setLocalDescription(sdpOffer)
    this._signalingServer.sendSdpOffer(this._rtcConnectionId, sdpOffer)
  }

  public disconnect(): void {
    this.cleanupConnectionState(true)
    this.cleanupTransportResources()
  }

  // 필요시 getter 추가하기
  // public getPeerConnection(): RTCPeerConnection | null {
  // }

  public async receiveSdpAnswer(sdpAnswerStr: string): Promise<void> {
    if (!this.peerConnection) {
      return Promise.reject("Peer connection is not initialized yet!")
    }
    const sdpAnswer = this.resolveSdpAnswer(sdpAnswerStr)

    try {
      await this.peerConnection.setRemoteDescription(sdpAnswer)
    } catch (error) {
      console.error(
        `[${this.robotId}] Failed to set remote description:`,
        error,
      )
      return Promise.reject(error)
    }
  }

  public async receiveIceCandidate(iceCandidate: IceCandidate): Promise<void> {
    if (!this.peerConnection) {
      return Promise.reject("Peer connection is not initialized yet!")
    }
    const rtcIceCandidate = this.resolveIceCandidate(iceCandidate)
    try {
      await this.peerConnection.addIceCandidate(rtcIceCandidate)
    } catch (error) {
      console.error(`[${this.robotId}] Failed to add ICE candidate:`, error)
      return Promise.reject(error)
    }
  }

  public removeDataChannel(robotConnector: RobotConnector): void {
    // parallel data channel 정리
    if (robotConnector.dataType.endsWith("-p")) {
      for (let i = 0; i < robotConnector.parallelNum; i++) {
        const label = `${robotConnector.connectorId}-${i}`
        const channel = this.dataChannels.get(label)
        if (!channel) {
          continue
        }
        channel.onopen = null
        channel.onmessage = null
        channel.onclose = null
        channel.onerror = null
        if (channel.readyState !== "closed") {
          try {
            channel.close()
          } catch (error) {
            console.error(
              `[${this.robotId}][${label}] Failed to close data channel:`,
              error,
            )
          }
        }
        this.dataChannels.delete(label)
      }
      return
    }

    // single data channel 정리
    const label = robotConnector.connectorId
    const channel = this.dataChannels.get(label)
    if (!channel) {
      return
    }
    channel.onopen = null
    channel.onmessage = null
    channel.onclose = null
    channel.onerror = null
    if (channel.readyState !== "closed") {
      try {
        channel.close()
      } catch (error) {
        console.error(
          `[${this.robotId}][${label}] Failed to close data channel:`,
          error,
        )
      }
    }
    this.dataChannels.delete(label)
  }

  private beforeConnection() {
    // reorganize connectorRequirements based on channelRequirements

    // Initializing variables
    this.relatedStores = []
    this.connectorRequirements = []

    for (const channelRequirement of this.channelRequirements) {
      const {robotConnector, store} = channelRequirement
      this.relatedStores.push(store)

      const connectorRequirement = this.connectorRequirements.find(
        (cr) => cr.robotConnector.serialize() === robotConnector.serialize(),
      )
      if (connectorRequirement) {
        connectorRequirement.stores.push(store)
      } else {
        this.connectorRequirements.push({robotConnector, stores: [store]})
      }
    }

    // validate if fit with robotConnector.dataType and storeType
    for (const connectorRequirement of this.connectorRequirements) {
      const {robotConnector, stores} = connectorRequirement
      const dataType = robotConnector.dataType
      const direction = dataType.split("-")[1]

      let flag = false

      if (dataType === "media") {
        flag = stores.every((store) => store.getStoreType() === "media")
      } else if (dataType.endsWith("-p")) {
        flag = stores.every((store) => {
          if (store.getStoreType() !== "receivable") {
            return false
          }
          const receivableStore = store as ReceivableStore
          return receivableStore.isParallelReceivable
        })
      } else {
        if (direction === "r2u") {
          flag = stores.every((store) => store.getStoreType() === "receivable")
        } else if (direction === "u2r") {
          flag = stores.every((store) => store.getStoreType() === "sendable")
        } else if (direction === "bi") {
          flag = stores.every(
            (store) => store.getStoreType() === "bidirectional",
          )
        }
      }

      if (!flag) {
        console.error(
          `[${this.robotId}] Connector requirement is not valid:`,
          connectorRequirement,
        )
        throw new Error("Connector requirement is not valid!")
      }
    }

    for (const store of this.relatedStores) {
      store.notifyBeforeConnected(this.robotId)
    }
  }

  private createPeerConnection(): RTCPeerConnection {
    const configuration = {
      iceServers: this.iceServers,
    }
    const peerConnection = new RTCPeerConnection(configuration)
    this.peerConnection = peerConnection
    peerConnection.onicecandidate = this.onicecandidate.bind(this)
    peerConnection.onconnectionstatechange =
      this.onconnectionstatechange.bind(this)
    peerConnection.ontrack = this.ontrack.bind(this)
    return peerConnection
  }

  private setupConnectors(): void {
    for (const {robotConnector, stores} of this.connectorRequirements) {
      if (robotConnector.dataType === "media") {
        // TODO: setup media
        // TODO: 시퀀스 안만듦. 레거시쪽 media store 보기 귀찮아서 안만들었던 기억 있음
        //  우선 DC 먼저
      } else if (robotConnector.dataType.endsWith("-p")) {
        for (let i = 0; i < robotConnector.parallelNum; i++) {
          const dc = this.createDataChannel(
            `${robotConnector.connectorId}-${i}`,
          )
          this.setupReceivableChannel(dc, stores as ReceivableStore[])
        }
      } else {
        const dc = this.createDataChannel(robotConnector.connectorId)

        const dataType = robotConnector.dataType.replace("-p", "")
        const direction = dataType.split("-")[1]
        if (direction === "r2u") {
          this.setupReceivableChannel(dc, stores as ReceivableStore[])
        } else if (direction === "u2r") {
          this.setupSendableChannel(dc, stores as SendableStore<any>[])
        } else if (direction === "bi") {
          this.setupBidirectionalChannel(
            dc,
            stores as BidirectionalStore<any>[],
          )
        }
      }
    }
  }

  private createDataChannel(connectorId: string): RTCDataChannel {
    if (!this.peerConnection) {
      throw new Error("Peer connection is not initialized yet!")
    }
    const dc = this.peerConnection.createDataChannel(connectorId)
    this.dataChannels.set(connectorId, dc)
    return dc
  }

  private setupReceivableChannel(
    dc: RTCDataChannel,
    stores: ReceivableStore[],
  ): void {
    dc.onmessage = async (event) => {
      try {
        const arrayBuffer = await this.convertDcEventToArrayBuffer(event)
        const notify = stores.map((store) =>
          store.notifySubscribers(arrayBuffer),
        )
        await Promise.all(notify)
      } catch (error) {
        console.error(
          `[${this.robotId}][${dc.label}] Failed to process received data:`,
          error,
        )
      }
    }
  }

  private setupSendableChannel(
    dc: RTCDataChannel,
    stores: SendableStore<any>[],
  ): void {
    dc.onopen = () => {
      for (const store of stores) {
        store.setDataChannel(dc)
      }
    }
  }

  private setupBidirectionalChannel(
    dc: RTCDataChannel,
    stores: BidirectionalStore<any>[],
  ): void {
    dc.onopen = () => {
      for (const store of stores) {
        store.setDataChannel(dc)
      }
    }
    dc.onmessage = async (event) => {
      try {
        const arrayBuffer = await this.convertDcEventToArrayBuffer(event)
        const notify = stores.map((store) =>
          store.notifySubscribers(arrayBuffer),
        )
        await Promise.all(notify)
      } catch (error) {
        console.error(
          `[${this.robotId}][${dc.label}] Failed to process received data:`,
          error,
        )
      }
    }
  }

  private async convertDcEventToArrayBuffer(
    event: MessageEvent,
  ): Promise<ArrayBuffer> {
    const data = event.data

    if (data instanceof Blob) {
      return await data.arrayBuffer()
    }
    return data
  }

  private async createSdpOffer(): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection) {
      return Promise.reject("Peer connection is not initialized yet!")
    }

    // count required media streams (we aren't sure if these logics are required)
    const numMediaStreams = this.connectorRequirements.filter(
      (cr) => cr.robotConnector.dataType === "media",
    ).length

    for (let index = 0; index < numMediaStreams; index++) {
      this.peerConnection.addTransceiver("video")
    }
    return this.peerConnection.createOffer()
  }

  private onicecandidate(event: RTCPeerConnectionIceEvent): void {
    if (!event.candidate) return

    this._signalingServer?.sendIceCandidate(
      this._rtcConnectionId,
      event.candidate,
    )
  }

  private onconnectionstatechange(): void {
    const state = this.peerConnection?.connectionState
    console.log(`[${this.robotId}] Connection state changed to ${state}`)

    if (state === "connected") {
      this.onConnectionConnected()
    } else if (state === "disconnected") {
      this.onConnectionDisconnected()
    } else if (state === "failed") {
      this.onConnectionFailed()
    }
  }

  private ontrack(event: RTCTrackEvent): void {
    console.log(
      `Received remote track id: ${event.track.id}, 
      stream id: ${event.streams?.[0]?.id} 
      kind: ${event.track.kind}`,
    )

    if (event.track.kind !== "video" || !event.streams?.[0]) {
      console.log(
        `[${this.robotId}] Video track is not of kind video or has no stream`,
      )
      return
    }

    const stream = event.streams[0]
    this.mediaStreams.set(stream.id, stream)

    // TODO: need to connect to the store
  }

  private onConnectionConnected(): void {
    for (const store of this.relatedStores) {
      store.notifyAfterConnected(this.robotId)
    }
  }

  private onConnectionDisconnected(): void {
    this.cleanupConnectionState(false)
  }

  private onConnectionFailed(): void {
    for (const store of this.relatedStores) {
      store.notifyAfterConnectionFailed(this.robotId)
    }
  }

  private resolveSdpAnswer(sdpAnswer: string): RTCSessionDescriptionInit {
    return new RTCSessionDescription({
      type: "answer",
      sdp: sdpAnswer,
    })
  }

  private resolveIceCandidate(iceCandidate: IceCandidate): RTCIceCandidate {
    return new RTCIceCandidate(iceCandidate)
  }

  private cleanupConnectionState(resetRequirements: boolean): void {
    if (this.isDisconnectedNotified) {
      return
    }
    this.isDisconnectedNotified = true
    for (const store of this.relatedStores) {
      store.notifyAfterDisconnected(this.robotId)
    }
    // resetRequirements가 true일 경우에만 연결 초기화
    if (resetRequirements) {
      this.channelRequirements = []
      this.connectorRequirements = []
      this.relatedStores = []
    }
  }

  private cleanupTransportResources(): void {
    // data channel 정리
    for (const channel of this.dataChannels.values()) {
      channel.onopen = null
      channel.onmessage = null
      channel.onclose = null
      channel.onerror = null
      if (channel.readyState !== "closed") {
        try {
          channel.close()
        } catch (error) {
          console.error(
            `[${this.robotId}][${channel.label}] Failed to close data channel:`,
            error,
          )
        }
      }
    }
    this.dataChannels.clear()

    // peer connection 정리
    if (this.peerConnection) {
      this.peerConnection.onicecandidate = null
      this.peerConnection.onconnectionstatechange = null
      this.peerConnection.ontrack = null

      if (this.peerConnection.signalingState !== "closed") {
        try {
          this.peerConnection.close()
        } catch (error) {
          console.error(
            `[${this.robotId}] Failed to close peer connection:`,
            error,
          )
        }
      }
      this.peerConnection = null
    }

    // media stream 정리
    for (const stream of this.mediaStreams.values()) {
      for (const track of stream.getTracks()) {
        track.stop()
      }
    }
    this.mediaStreams.clear()
  }
}
