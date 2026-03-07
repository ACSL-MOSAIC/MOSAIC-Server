import type { RobotConnector } from "@/mosaic";
import type { ChannelRequirement } from "@/mosaic/channel";
import type { RobotInfo } from "@/mosaic/robot-info.ts";
import type { MosaicStore } from "@/mosaic/store/interface/mosaic-store.ts";
import type { ReceivableStore } from "@/mosaic/store/interface/receivable-store.ts";
import type { SendableStore } from "@/mosaic/store/interface/sendable-store.ts";
import type { ConnectorRequirement } from "@/mosaic/webrtc/index.ts";
import type { SignalingServer } from "@/mosaic/webrtc/signaling-server.ts";
import type { IceCandidate } from "@/mosaic/webrtc/signaling.dto.ts";
import type { MediaStreamStore } from "@/stores/MediaStreamStore/MediaStreamStore.ts";

export class WebRTCConnection {
  private readonly _rtcConnectionId: string;
  private readonly robotInfo: RobotInfo;
  private peerConnection: RTCPeerConnection | null;
  private iceServers: RTCIceServer[] = [];
  private channelRequirements: ChannelRequirement[] = [];
  private connectorRequirements: ConnectorRequirement[] = [];
  private relatedStores: MosaicStore[] = [];
  private dataChannels: Map<string, RTCDataChannel> = new Map();
  private mediaStreams: Map<string, MediaStream> = new Map();
  private _signalingServer: SignalingServer | null = null;
  // disconnected 이벤트와 수동 disconnect가 모두 호출되었을 때 중복 호출 방지
  private isDisconnectedNotified = false;

  constructor(rtcConnectionId: string, robotInfo: RobotInfo, iceServers: RTCIceServer[]) {
    this._rtcConnectionId = rtcConnectionId;
    this.robotInfo = robotInfo;
    this.iceServers = [...iceServers];
    this.peerConnection = null;
  }

  get rtcConnectionId(): string {
    return this._rtcConnectionId;
  }

  set signalingServer(value: SignalingServer) {
    this._signalingServer = value;
  }

  public createConnection(channelRequirements: ChannelRequirement[]): void {
    this.isDisconnectedNotified = false;
    this.channelRequirements = channelRequirements;

    this.beforeConnection();
    this.peerConnection = this.createPeerConnection();
    this.setupConnectors();
  }

  public async startConnection(): Promise<void> {
    if (!this.peerConnection) {
      return Promise.reject("Peer connection is not initialized yet!");
    }
    if (!this._signalingServer) {
      return Promise.reject("Signaling server is not initialized yet!");
    }

    const sdpOffer = await this.createSdpOffer();
    await this.peerConnection.setLocalDescription(sdpOffer);
    this._signalingServer.sendSdpOffer(this._rtcConnectionId, sdpOffer);
  }

  public disconnect(): void {
    this.cleanupConnectionState(true);
    this.cleanupTransportResources();
  }

  // 필요시 getter 추가하기
  // public getPeerConnection(): RTCPeerConnection | null {
  // }

  public async receiveSdpAnswer(sdpAnswerStr: string): Promise<void> {
    if (!this.peerConnection) {
      return Promise.reject("Peer connection is not initialized yet!");
    }
    const sdpAnswer = this.resolveSdpAnswer(sdpAnswerStr);

    try {
      await this.peerConnection.setRemoteDescription(sdpAnswer);
    } catch (error) {
      console.error(`[${this.robotInfo.id}] Failed to set remote description:`, error);
      return Promise.reject(error);
    }
  }

  public async receiveIceCandidate(iceCandidate: IceCandidate): Promise<void> {
    if (!this.peerConnection) {
      return Promise.reject("Peer connection is not initialized yet!");
    }
    const rtcIceCandidate = this.resolveIceCandidate(iceCandidate);
    try {
      await this.peerConnection.addIceCandidate(rtcIceCandidate);
    } catch (error) {
      console.error(`[${this.robotInfo.id}] Failed to add ICE candidate:`, error);
      return Promise.reject(error);
    }
  }

  private closeAndRemoveDataChannel(label: string): void {
    const channel = this.dataChannels.get(label);
    if (!channel) {
      return;
    }
    channel.onopen = null;
    channel.onmessage = null;
    channel.onclose = null;
    channel.onerror = null;
    if (channel.readyState !== "closed") {
      try {
        channel.close();
      } catch (error) {
        console.error(`[${this.robotInfo.id}][${label}] Failed to close data channel:`, error);
      }
    }
    this.dataChannels.delete(label);
  }

  public removeDataChannel(robotConnector: RobotConnector): void {
    const connectorRequirement = this.connectorRequirements.find(
      (cr) => cr.robotConnector.serialize() === robotConnector.serialize(),
    );
    if (!connectorRequirement) {
      return;
    }
    if (connectorRequirement.parallelNum) {
      for (let i = 0; i < connectorRequirement.parallelNum; i++) {
        this.closeAndRemoveDataChannel(`${robotConnector.connectorId}-${i}`);
      }
      return;
    }
    this.closeAndRemoveDataChannel(robotConnector.connectorId);
  }

  private beforeConnection() {
    // reorganize connectorRequirements based on channelRequirements

    // Initializing variables
    this.relatedStores = [];
    this.connectorRequirements = [];

    for (const channelRequirement of this.channelRequirements) {
      const { robotConnector, store } = channelRequirement;
      this.relatedStores.push(store);

      const connectorRequirement = this.connectorRequirements.find(
        (cr) => cr.robotConnector.serialize() === robotConnector.serialize(),
      );
      if (connectorRequirement) {
        connectorRequirement.stores.push(store);
      } else {
        const connectorConfig = this.robotInfo.robotConfigs.connectors.find(
          (connector) => connector.connectorId === robotConnector.connectorId,
        );
        if (!connectorConfig) {
          console.error(
            `[${this.robotInfo.id}] Connector id is not valid: ${robotConnector.connectorId}`,
          );
          throw new Error("Connector id is not valid");
        }
        this.connectorRequirements.push({
          robotConnector,
          storeType: store.getStoreType(),
          parallelNum: connectorConfig.params?.parallelNum,
          stores: [store],
        });
      }
    }

    // validate if fit with connectorRequirement.storeType and stores
    for (const connectorRequirement of this.connectorRequirements) {
      const { storeType, parallelNum, stores } = connectorRequirement;

      let flag = false;

      if (storeType === "media") {
        // All rest stores must be media store
        flag = stores.every((store) => store.getStoreType() === "media");
      } else if (storeType === "receivable") {
        // All rest stores must be receivable store
        flag = stores.every((store) => store.getStoreType() === "receivable");
      } else if (storeType === "sendable") {
        // All rest stores must be sendable store
        flag = stores.every((store) => store.getStoreType() === "sendable");
      }

      if (parallelNum && storeType !== "receivable") {
        flag = true;
      }

      if (!flag) {
        console.error(
          `[${this.robotInfo.id}] Connector requirement is not valid:`,
          connectorRequirement,
        );
        throw new Error("Connector requirement is not valid!");
      }
    }

    for (const store of this.relatedStores) {
      store.notifyBeforeConnected(this.robotInfo.id);
    }
  }

  private createPeerConnection(): RTCPeerConnection {
    const peerConnection =
      this.iceServers.length === 0
        ? new RTCPeerConnection()
        : new RTCPeerConnection({ iceServers: this.iceServers });
    this.peerConnection = peerConnection;
    peerConnection.onicecandidate = this.onicecandidate.bind(this);
    peerConnection.onconnectionstatechange = this.onconnectionstatechange.bind(this);
    peerConnection.ontrack = this.ontrack.bind(this);
    return peerConnection;
  }

  private setupConnectors(): void {
    const mediaConnectorRequirements: ConnectorRequirement[] = [];

    for (const { robotConnector, storeType, parallelNum, stores } of this.connectorRequirements) {
      if (storeType === "media") {
        mediaConnectorRequirements.push({
          robotConnector,
          storeType,
          parallelNum,
          stores,
        });
      } else {
        if (parallelNum) {
          for (let i = 0; i < parallelNum; i++) {
            const dc = this.createDataChannel(`${robotConnector.connectorId}-${i}`);
            this.setupReceivableChannel(dc, stores as ReceivableStore<any>[]);
          }
        } else {
          const dc = this.createDataChannel(robotConnector.connectorId);

          if (storeType === "receivable") {
            this.setupReceivableChannel(dc, stores as ReceivableStore<any>[]);
          } else {
            this.setupSendableChannel(dc, stores as SendableStore<any>[]);
          }
        }
      }
    }

    this.setupMediaStreamStore(mediaConnectorRequirements);
  }

  private setupMediaStreamStore(connectorRequirements: ConnectorRequirement[]) {
    if (!this.peerConnection) {
      throw new Error("Peer connection is not initialized yet!");
    }
    this.peerConnection.ontrack = (event: RTCTrackEvent) => {
      if (!this.peerConnection) {
        console.error("PeerConnection not initialized");
        return;
      }

      if (event.track.kind !== "video" || !event.streams?.[0]) {
        console.warn("Track has no video stream");
        return;
      }

      const stream = event.streams[0];

      // Use media type extracted from MSID
      const mediaType = stream.id;

      if (!mediaType) {
        console.warn("Media type not found in metadata");
        return;
      }

      const mediaStreamStores: MediaStreamStore[] = connectorRequirements
        .filter((cr) => cr.storeType === "media")
        .flatMap((cr) => cr.stores.map((store) => store as MediaStreamStore));

      for (const mediaStreamStore of mediaStreamStores) {
        mediaStreamStore.setPeerConnection(this.peerConnection);
        mediaStreamStore.setMediaStreamTrack(event.track);
        mediaStreamStore.setMediaStream(stream);
      }
    };
  }

  private createDataChannel(connectorId: string): RTCDataChannel {
    if (!this.peerConnection) {
      throw new Error("Peer connection is not initialized yet!");
    }
    const dc = this.peerConnection.createDataChannel(connectorId);
    this.dataChannels.set(connectorId, dc);
    return dc;
  }

  private setupReceivableChannel(dc: RTCDataChannel, stores: ReceivableStore<any>[]): void {
    dc.onmessage = async (event) => {
      try {
        const data = await this.convertDcEventToArrayBuffer(event);
        const notify = stores.map((store) => store.notifySubscribers(data));
        await Promise.all(notify);
      } catch (error) {
        console.error(
          `[${this.robotInfo.id}][${dc.label}] Failed to process received data:`,
          error,
        );
      }
    };
  }

  private setupSendableChannel(dc: RTCDataChannel, stores: SendableStore<any>[]): void {
    dc.onopen = () => {
      console.log(`[${this.robotInfo.id}][${dc.label}] Data channel is opened!`, stores);
      for (const store of stores) {
        store.setDataChannel(dc);
      }
    };
  }

  private async convertDcEventToArrayBuffer(event: MessageEvent): Promise<ArrayBuffer | string> {
    const data = event.data;

    if (data instanceof Blob) {
      return await data.arrayBuffer();
    }
    return data;
  }

  private async createSdpOffer(): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection) {
      return Promise.reject("Peer connection is not initialized yet!");
    }

    // count required media streams (we aren't sure if these logics are required)
    const numMediaStreams = this.connectorRequirements.filter(
      (cr) => cr.storeType === "media",
    ).length;

    for (let index = 0; index < numMediaStreams; index++) {
      this.peerConnection.addTransceiver("video");
    }
    return this.peerConnection.createOffer();
  }

  private onicecandidate(event: RTCPeerConnectionIceEvent): void {
    if (!event.candidate) return;

    this._signalingServer?.sendIceCandidate(this._rtcConnectionId, event.candidate);
  }

  private onconnectionstatechange(): void {
    const state = this.peerConnection?.connectionState;
    console.log(`[${this.robotInfo.id}] Connection state changed to ${state}`);

    if (state === "connected") {
      this.onConnectionConnected();
    } else if (state === "disconnected") {
      this.onConnectionDisconnected();
    } else if (state === "failed") {
      this.onConnectionFailed();
    }
  }

  private ontrack(event: RTCTrackEvent): void {
    console.log(
      `Received remote track id: ${event.track.id}, 
      stream id: ${event.streams?.[0]?.id} 
      kind: ${event.track.kind}`,
    );

    if (event.track.kind !== "video" || !event.streams?.[0]) {
      console.log(`[${this.robotInfo.id}] Video track is not of kind video or has no stream`);
      return;
    }

    const stream = event.streams[0];
    this.mediaStreams.set(stream.id, stream);

    // TODO: need to connect to the store
  }

  private onConnectionConnected(): void {
    console.log(
      `[${this.robotInfo.id}] Connection established!, notifying related stores: `,
      this.relatedStores,
    );
    for (const store of this.relatedStores) {
      store.notifyAfterConnected(this.robotInfo.id);
    }
  }

  private onConnectionDisconnected(): void {
    this.cleanupConnectionState(false);
  }

  private onConnectionFailed(): void {
    for (const store of this.relatedStores) {
      store.notifyAfterConnectionFailed(this.robotInfo.id);
    }
  }

  private resolveSdpAnswer(sdpAnswer: string): RTCSessionDescriptionInit {
    return new RTCSessionDescription({
      type: "answer",
      sdp: sdpAnswer,
    });
  }

  private resolveIceCandidate(iceCandidate: IceCandidate): RTCIceCandidate {
    return new RTCIceCandidate(iceCandidate);
  }

  private cleanupConnectionState(resetRequirements: boolean): void {
    if (this.isDisconnectedNotified) {
      return;
    }
    this.isDisconnectedNotified = true;
    for (const store of this.relatedStores) {
      store.notifyAfterDisconnected(this.robotInfo.id);
    }
    // resetRequirements가 true일 경우에만 연결 초기화
    if (resetRequirements) {
      this.channelRequirements = [];
      this.connectorRequirements = [];
      this.relatedStores = [];
    }
  }

  private cleanupDataChannels(): void {
    for (const label of Array.from(this.dataChannels.keys())) {
      this.closeAndRemoveDataChannel(label);
    }
  }

  private cleanupPeerConnection(): void {
    if (!this.peerConnection) {
      return;
    }
    this.peerConnection.onicecandidate = null;
    this.peerConnection.onconnectionstatechange = null;
    this.peerConnection.ontrack = null;

    if (this.peerConnection.signalingState !== "closed") {
      try {
        this.peerConnection.close();
      } catch (error) {
        console.error(`[${this.robotInfo.id}] Failed to close peer connection:`, error);
      }
    }
    this.peerConnection = null;
  }

  private cleanupMediaStreams(): void {
    for (const stream of this.mediaStreams.values()) {
      for (const track of stream.getTracks()) {
        track.stop();
      }
    }
    this.mediaStreams.clear();
  }

  private cleanupTransportResources(): void {
    this.cleanupDataChannels();
    this.cleanupMediaStreams();
    this.cleanupPeerConnection();
  }
}
