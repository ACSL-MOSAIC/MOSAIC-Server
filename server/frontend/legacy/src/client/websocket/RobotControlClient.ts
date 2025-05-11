import { ControlDirection, WebSocketMessage, PositionData } from '@/types/robot-control';

export class RobotControlClient {
  private ws: WebSocket | null = null;
  private peerConnection: RTCPeerConnection | null = null;
  private remoteControlDataChannel: RTCDataChannel | null = null;
  private positionDataChannel: RTCDataChannel | null = null;
  private iceCandidateList: RTCIceCandidate[] = [];
  private lastConnectionCheckTime: number | null = null;
  private connectingCheckInterval: NodeJS.Timeout | null = null;

  constructor(
    private userId: string,
    private robotId: string,
    private onPositionUpdate: (position: PositionData) => void,
    private onVideoStream: (stream: MediaStream) => void,
    private onConnectionStateChange: (state: string) => void
  ) {
    this.connect();
  }

  private connect() {
    this.ws = new WebSocket(`/ws/control/${this.userId}`);
    this.setupWebSocket();
    this.setupWebRTC();
  }

  private setupWebSocket() {
    if (!this.ws) return;

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.ws?.send(JSON.stringify({ type: 'get_robot_list' }));
    };

    this.ws.onmessage = async (event) => {
      const data: WebSocketMessage = JSON.parse(event.data);
      switch (data.type) {
        case 'receive_sdp_answer':
          await this.handleSdpAnswer(data.sdp_answer);
          break;
        case 'receive_ice_candidate':
          await this.handleIceCandidate(data.ice_candidate);
          break;
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.onConnectionStateChange('error');
    };

    this.ws.onclose = () => {
      console.log('WebSocket closed');
      this.onConnectionStateChange('disconnected');
    };
  }

  private async setupWebRTC() {
    this.peerConnection = new RTCPeerConnection({
      iceServers: [{
        urls: "turn:turn.acslgcs.com:3478",
        username: "gistacsl",
        credential: "qwqw!12321"
      }]
    });

    this.peerConnection.onicecandidate = this.handleIceCandidateEvent;
    this.peerConnection.ondatachannel = this.handleDataChannel;
    this.peerConnection.ontrack = this.handleTrack;
    this.peerConnection.onconnectionstatechange = () => {
      this.onConnectionStateChange(this.peerConnection?.connectionState || 'unknown');
    };

    // 비디오 트랜시버 추가
    this.peerConnection.addTransceiver('video', { direction: 'sendrecv' });
    
    // 원격 제어 데이터 채널 생성
    this.remoteControlDataChannel = this.peerConnection.createDataChannel('remote_control');
    this.setupRemoteControlChannel();

    // SDP offer 생성 및 전송
    await this.createAndSendOffer();
  }

  private async createAndSendOffer() {
    if (!this.peerConnection || !this.ws) return;

    try {
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);

      this.ws.send(JSON.stringify({
        type: 'send_sdp_offer',
        user_id: this.userId,
        robot_id: this.robotId,
        sdp_offer: offer.sdp
      }));
    } catch (error) {
      console.error('Error creating offer:', error);
    }
  }

  private handleIceCandidateEvent = (event: RTCPeerConnectionIceEvent) => {
    if (!event.candidate || !this.ws) return;

    this.ws.send(JSON.stringify({
      type: 'send_ice_candidate',
      user_id: this.userId,
      robot_id: this.robotId,
      ice_candidate: event.candidate
    }));
  };

  private handleDataChannel = (event: RTCDataChannelEvent) => {
    const channel = event.channel;
    if (channel.label === 'position_data_channel') {
      this.setupPositionChannel(channel);
    }
  };

  private handleTrack = (event: RTCTrackEvent) => {
    if (event.streams && event.streams[0]) {
      this.onVideoStream(event.streams[0]);
    }
  };

  private setupRemoteControlChannel() {
    if (!this.remoteControlDataChannel) return;

    this.remoteControlDataChannel.onopen = () => {
      console.log('Remote control channel opened');
      this.startConnectionCheck();
    };

    this.remoteControlDataChannel.onclose = () => {
      console.log('Remote control channel closed');
      this.stopConnectionCheck();
    };
  }

  private setupPositionChannel(channel: RTCDataChannel) {
    this.positionDataChannel = channel;
    
    channel.onmessage = (event) => {
      try {
        const positionData: PositionData = JSON.parse(event.data);
        this.onPositionUpdate(positionData);
      } catch (error) {
        console.error('Error parsing position data:', error);
      }
    };
  }

  private startConnectionCheck() {
    this.connectingCheckInterval = setInterval(() => {
      if (this.remoteControlDataChannel?.readyState === 'open') {
        this.remoteControlDataChannel.send(JSON.stringify({
          type: 'connection_check',
          user_id: this.userId,
          robot_id: this.robotId
        }));
      }
    }, 5000);
  }

  private stopConnectionCheck() {
    if (this.connectingCheckInterval) {
      clearInterval(this.connectingCheckInterval);
      this.connectingCheckInterval = null;
    }
  }

  public async sendControlCommand(direction: ControlDirection) {
    if (this.remoteControlDataChannel?.readyState === 'open') {
      this.remoteControlDataChannel.send(JSON.stringify({
        type: 'control',
        direction
      }));
    }
  }

  public disconnect() {
    this.stopConnectionCheck();
    this.remoteControlDataChannel?.close();
    this.positionDataChannel?.close();
    this.peerConnection?.close();
    this.ws?.close();
  }

  private async handleSdpAnswer(sdpAnswer: string) {
    if (!this.peerConnection) return;

    try {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription({
        type: 'answer',
        sdp: sdpAnswer
      }));

      // 저장된 ICE candidate들을 추가
      for (const candidate of this.iceCandidateList) {
        await this.peerConnection.addIceCandidate(candidate);
      }
      this.iceCandidateList = [];
    } catch (error) {
      console.error('Error handling SDP answer:', error);
    }
  }

  private async handleIceCandidate(iceCandidate: RTCIceCandidateInit) {
    if (!this.peerConnection) return;

    try {
      const candidate = new RTCIceCandidate(iceCandidate);
      if (this.peerConnection.remoteDescription) {
        await this.peerConnection.addIceCandidate(candidate);
      } else {
        this.iceCandidateList.push(candidate);
      }
    } catch (error) {
      console.error('Error handling ICE candidate:', error);
    }
  }
} 