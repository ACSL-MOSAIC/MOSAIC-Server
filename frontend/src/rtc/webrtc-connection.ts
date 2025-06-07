import { WebSocketContextType } from "@/contexts/WebSocketContext"
import { setupWebSocketHandlers, sendWebSocketMessage } from "./ws-adaptor"
import { setupDataChannel, cleanupAllDataChannels } from "./webrtc-utils"

export interface WebRTCConnectionConfig {
  robotId: string
  ws: WebSocketContextType
  onConnectionStateChange?: (isConnected: boolean) => void
}

export class WebRTCConnection {
  private peerConnection: RTCPeerConnection | null = null
  private config: WebRTCConnectionConfig
  private unsubscribeFunctions: (() => void)[] = []
  private pendingCandidates: RTCIceCandidate[] = []
  private dataChannels: Map<string, RTCDataChannel> = new Map()

  constructor(config: WebRTCConnectionConfig) {
    this.config = config
    this.setupWebSocketHandlers()
  }

  private setupWebSocketHandlers() {
    const { unsubscribe } = setupWebSocketHandlers(this.config.ws, this.config.robotId, {
      onSdpAnswer: async (sdpAnswer) => {
        try {
          await this.setRemoteDescription(new RTCSessionDescription({
            type: 'answer',
            sdp: sdpAnswer
          }))
          
          // SDP answer가 설정된 후에 pending된 ICE candidates 적용
          if (this.pendingCandidates.length > 0) {
            console.log('Pending ICE candidates 적용:', this.pendingCandidates.length)
            for (const candidate of this.pendingCandidates) {
              try {
                await this.addIceCandidate(candidate)
                console.log('Pending ICE candidate 적용 성공')
              } catch (error) {
                console.error('Pending ICE candidate 적용 실패:', error)
              }
            }
            this.pendingCandidates = []
          }
        } catch (error) {
          console.error('SDP Answer 처리 중 에러:', error)
        }
      },
      onIceCandidate: async (candidate) => {
        try {
          // Remote description이 설정되어 있지 않으면 pending
          if (!this.peerConnection?.remoteDescription) {
            console.log('Remote description이 없어서 ICE candidate를 pending')
            this.pendingCandidates.push(candidate)
            return
          }

          await this.addIceCandidate(candidate)
        } catch (error) {
          console.error('ICE Candidate 처리 중 에러:', error)
        }
      }
    })

    this.unsubscribeFunctions.push(unsubscribe)
  }

  private createPeerConnection(): RTCPeerConnection {
    const configuration = {
      iceServers: [
        {
          urls: "turn:turn.acslgcs.com:3478",
          username: "gistacsl",
          credential: "qwqw!12321"
        }
      ]
    }
    const peerConnection = new RTCPeerConnection(configuration)

    // DataChannel 이벤트 핸들러 설정
    peerConnection.ondatachannel = (event) => {
      const dataChannel = event.channel
      console.log('DataChannel 수신됨:', dataChannel.label, dataChannel.readyState)
      this.setupDataChannel(dataChannel)
    }

    // DataChannel 생성
    console.log('DataChannel 생성 시작')
    const dataChannel = peerConnection.createDataChannel('low_state_data_channel', {
      ordered: true
    })
    console.log('DataChannel 생성됨:', dataChannel.label, dataChannel.readyState)
    this.setupDataChannel(dataChannel)

    return peerConnection
  }

  private setupDataChannel(dataChannel: RTCDataChannel) {
    console.log('DataChannel 설정 시작:', dataChannel.label)
    
    // DataChannel 상태 변경 이벤트 핸들러
    dataChannel.onopen = () => {
      console.log(`DataChannel ${dataChannel.label} 열림, 상태:`, dataChannel.readyState)
    }

    dataChannel.onclose = () => {
      console.log(`DataChannel ${dataChannel.label} 닫힘, 상태:`, dataChannel.readyState)
      this.dataChannels.delete(dataChannel.label)
    }

    dataChannel.onerror = (error) => {
      console.error(`DataChannel ${dataChannel.label} 에러:`, error)
    }

    setupDataChannel(dataChannel, this.config.robotId)

    // DataChannel 저장
    this.dataChannels.set(dataChannel.label, dataChannel)
    console.log('DataChannel 설정 완료:', dataChannel.label)
  }

  public async startConnection(): Promise<void> {
    try {
      // 기존 연결이 있다면 정리
      if (this.peerConnection) {
        this.disconnect()
      }

      this.peerConnection = this.createPeerConnection()
      console.log('PeerConnection 생성됨:', this.peerConnection)

      // 이벤트 핸들러 설정
      this.peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          console.log('ICE candidate 생성됨:', event.candidate)
          sendWebSocketMessage(this.config.ws, {
            type: "send_ice_candidate",
            robot_id: this.config.robotId,
            ice_candidate: event.candidate
          })
        }
      }

      this.peerConnection.oniceconnectionstatechange = () => {
        console.log('ICE connection state 변경:', this.peerConnection?.iceConnectionState)
        const isConnected = this.peerConnection?.iceConnectionState === 'connected'
        this.config.onConnectionStateChange?.(isConnected)
      }

      this.peerConnection.onsignalingstatechange = () => {
        console.log('Signaling state 변경:', this.peerConnection?.signalingState)
      }

      this.peerConnection.ontrack = (event) => {
        console.log('Track 수신됨:', event.track.kind)
        if (event.streams && event.streams[0]) {
          console.log('Stream 수신됨:', event.streams[0].id)
        }
      }

      // Offer 생성 및 설정
      console.log('Offer 생성 시작')
      const offer = await this.peerConnection.createOffer({
        offerToReceiveVideo: true,
        offerToReceiveAudio: false
      })
      console.log('Offer 생성됨:', offer)
      
      await this.peerConnection.setLocalDescription(offer)
      console.log('Local description 설정됨:', this.peerConnection.localDescription)

      // SDP offer를 서버로 전송
      sendWebSocketMessage(this.config.ws, {
        type: "send_sdp_offer",
        robot_id: this.config.robotId,
        sdp_offer: offer.sdp || ''
      })

    } catch (error) {
      console.error('Connection start error:', error)
      throw error
    }
  }

  public async setRemoteDescription(description: RTCSessionDescription): Promise<void> {
    if (!this.peerConnection) {
      console.error('PeerConnection이 초기화되지 않았습니다.')
      throw new Error("PeerConnection이 초기화되지 않았습니다.")
    }

    try {
      console.log('Remote description 설정 시도:', description)
      await this.peerConnection.setRemoteDescription(description)
      console.log('Remote description 설정 완료')
    } catch (error) {
      console.error('Remote description 설정 실패:', error)
      throw error
    }
  }

  public async addIceCandidate(candidate: RTCIceCandidate): Promise<void> {
    if (!this.peerConnection) {
      console.error('PeerConnection이 초기화되지 않았습니다.')
      throw new Error("PeerConnection이 초기화되지 않았습니다.")
    }

    try {
      await this.peerConnection.addIceCandidate(candidate)
      console.log('ICE candidate 적용 완료')
    } catch (error) {
      console.error('ICE candidate 추가 실패:', error)
      throw error
    }
  }

  public disconnect(): void {
    // WebSocket 이벤트 리스너 해제
    this.unsubscribeFunctions.forEach(unsubscribe => unsubscribe())
    this.unsubscribeFunctions = []

    // DataChannel 정리
    cleanupAllDataChannels(this.config.robotId)
    this.dataChannels.clear()

    if (this.peerConnection) {
      this.peerConnection.close()
      this.peerConnection = null
    }
    this.pendingCandidates = []
    this.config.onConnectionStateChange?.(false)
  }

  public getPeerConnection(): RTCPeerConnection | null {
    return this.peerConnection
  }

  public getDataChannel(label: string): RTCDataChannel | undefined {
    return this.dataChannels.get(label)
  }
}
