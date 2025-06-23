import { WebSocketContextType } from "@/contexts/WebSocketContext"
import { setupWebSocketHandlers, sendWebSocketMessage } from "./ws-adaptor"
import { setupDataChannel, cleanupAllDataChannels } from "./webrtc-utils"
import { StoreManager } from "@/dashboard/store/store-manager"
import { TurtlesimRemoteControlStore } from "@/dashboard/store/turtlesim-remote-control.store"
import { TURTLESIM_REMOTE_CONTROL_TYPE } from "@/dashboard/parser/turtlesim-remote-control"
import { VideoStoreManager } from "@/dashboard/store/video-store-manager"
import { VideoStore } from "@/dashboard/store/video.store"

export interface DataChannelConfig {
  label: string
  dataType: string // 'turtlesim_position', 'go2_low_state', 'go2_ouster_pointcloud' 등
  options?: RTCDataChannelInit
}

export interface VideoChannelConfig {
  label: string
  dataType: string // 'turtlesim_video', 'go2_camera' 등
  expectedTrackLabel?: string // 예상되는 비디오 트랙 라벨
}

export interface WebRTCConnectionConfig {
  robotId: string
  ws: WebSocketContextType
  onConnectionStateChange?: (isConnected: boolean) => void
  dataChannels?: DataChannelConfig[] // 채널별 설정
  videoChannels?: VideoChannelConfig[] // 비디오 채널 설정
}

export class WebRTCConnection {
  private peerConnection: RTCPeerConnection | null = null
  private config: WebRTCConnectionConfig
  private unsubscribeFunctions: (() => void)[] = []
  private pendingCandidates: RTCIceCandidate[] = []
  private dataChannels: Map<string, RTCDataChannel> = new Map()
  private channelDataTypes: Map<string, string> = new Map() // 채널 라벨 -> 데이터 타입 매핑
  private videoChannels: Map<string, VideoChannelConfig> = new Map() // 비디오 채널 설정
  private videoChannelDataTypes: Map<string, string> = new Map() // 비디오 채널 라벨 -> 데이터 타입 매핑

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
      
      // 수신된 채널의 데이터 타입을 매핑에서 가져옴
      const dataType = this.channelDataTypes.get(dataChannel.label)
      if (!dataType) {
        console.error(`등록되지 않은 채널 수신됨: ${dataChannel.label}`)
        return
      }
      
      this.setupDataChannel(dataChannel, dataType)
    }

    // 설정된 데이터 채널들 생성
    const channelsToCreate = this.config.dataChannels || []
    
    // 기본 채널들 추가 (설정에 없는 경우)
    const defaultChannels: DataChannelConfig[] = [
      { label: 'position_data_channel', dataType: 'turtlesim_position' },
      { label: 'data_channel', dataType: 'go2_low_state' },
      { label: 'remote_control_channel', dataType: 'turtlesim_remote_control' }
    ]
    
    const allChannels = [...channelsToCreate, ...defaultChannels.filter(ch => 
      !channelsToCreate.some(configured => configured.label === ch.label)
    )]

    console.log('DataChannel 생성 시작:', allChannels.map(ch => `${ch.label}(${ch.dataType})`))
    
    // 여러 데이터 채널 생성
    allChannels.forEach(channelConfig => {
      const dataChannel = peerConnection.createDataChannel(channelConfig.label, {
        ordered: true,
        ...channelConfig.options
      })
      
      console.log('DataChannel 생성됨:', dataChannel.label, dataChannel.readyState, '데이터타입:', channelConfig.dataType)
      
      // 채널과 데이터 타입 매핑 저장
      this.channelDataTypes.set(channelConfig.label, channelConfig.dataType)
      
      // turtlesim_remote_control 타입의 경우 바로 스토어에 데이터 채널 설정
      if (channelConfig.dataType === 'turtlesim_remote_control') {
        const storeManager = StoreManager.getInstance();
        const store = storeManager.createStoreIfNotExists(
          this.config.robotId,
          TURTLESIM_REMOTE_CONTROL_TYPE,
          (robotId) => new TurtlesimRemoteControlStore(robotId)
        );
        if (store instanceof TurtlesimRemoteControlStore) {
          store.setDataChannel(dataChannel);
          console.log(`WebRTC 연결 시 TurtlesimRemoteControlStore에 데이터 채널 설정:`, {
            robotId: this.config.robotId,
            channelLabel: dataChannel.label,
            channelState: dataChannel.readyState
          });
        }
      }
      
      // 생성된 채널도 설정
      this.setupDataChannel(dataChannel, channelConfig.dataType)
    })

    // 비디오 채널 설정 (데이터 채널 설정 이후)
    this.setupVideoChannels()

    return peerConnection
  }

  private setupVideoChannels() {
    // 설정된 비디오 채널들 저장
    const channelsToSetup = this.config.videoChannels || []
    
    // 기본 비디오 채널 추가 (설정에 없는 경우)
    const defaultVideoChannels: VideoChannelConfig[] = [
      { label: 'turtlesim_video_track', dataType: 'turtlesim_video', expectedTrackLabel: 'turtlesim_video' }
    ]
    
    const allVideoChannels = [...channelsToSetup, ...defaultVideoChannels.filter(ch => 
      !channelsToSetup.some(configured => configured.label === ch.label)
    )]

    console.log('설정할 비디오 채널들:', allVideoChannels)

    allVideoChannels.forEach(channelConfig => {
      this.videoChannels.set(channelConfig.label, channelConfig)
      this.videoChannelDataTypes.set(channelConfig.label, channelConfig.dataType)
      console.log('비디오 채널 설정됨:', channelConfig.label, '데이터타입:', channelConfig.dataType, '예상 트랙 라벨:', channelConfig.expectedTrackLabel)
    })
  }

  private setupDataChannel(dataChannel: RTCDataChannel, dataType: string) {
    console.log('DataChannel 설정 시작:', dataChannel.label, '데이터타입:', dataType)
    
    // DataChannel 상태 변경 이벤트 핸들러
    dataChannel.onopen = () => {
      console.log(`DataChannel ${dataChannel.label} 열림, 상태:`, dataChannel.readyState, '데이터타입:', dataType)
    }

    dataChannel.onclose = () => {
      console.log(`DataChannel ${dataChannel.label} 닫힘, 상태:`, dataChannel.readyState)
      this.dataChannels.delete(dataChannel.label)
      this.channelDataTypes.delete(dataChannel.label)
    }

    dataChannel.onerror = (error) => {
      console.error(`DataChannel ${dataChannel.label} 에러:`, error)
    }

    setupDataChannel(dataChannel, this.config.robotId, dataType)

    // DataChannel 저장
    this.dataChannels.set(dataChannel.label, dataChannel)
    console.log('DataChannel 설정 완료:', dataChannel.label, '데이터타입:', dataType)
  }

  public async startConnection(): Promise<void> {
    try {
      // 기존 연결이 있다면 정리
      if (this.peerConnection) {
        this.disconnect()
      }

      // VideoStoreManager 초기화
      const videoStoreManager = VideoStoreManager.getInstance()
      videoStoreManager.initializeRobotVideoStores(this.config.robotId)

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
        console.log('Track 수신됨:', event.track.kind, event.track.label, event.track.id)
        
        if (event.track.kind === 'video' && event.streams && event.streams[0]) {
          const stream = event.streams[0]
          const trackLabel = event.track.label || 'unknown_video'
          
          console.log('로봇 비디오 스트림 수신됨:', {
            streamId: stream.id,
            trackLabel: trackLabel,
            trackId: event.track.id,
            trackEnabled: event.track.enabled,
            trackReadyState: event.track.readyState
          })
          
          // 모든 비디오 트랙을 터틀비디오로 처리
          const matchedChannelLabel = 'turtlesim_video_track'
          const matchedDataType = 'turtlesim_video'
          
          console.log('비디오 채널 매칭 결과:', {
            channelLabel: matchedChannelLabel,
            dataType: matchedDataType,
            originalTrackLabel: trackLabel
          })
          
          // VideoStoreManager를 통해 비디오 스토어 생성 및 MediaStream 설정
          const videoStore = VideoStoreManager.getInstance().createVideoStoreIfNotExists(
            this.config.robotId,
            matchedChannelLabel,
            matchedDataType
          )
          
          videoStore.setMediaStream(stream)
          console.log(`비디오 스토어 설정 완료: ${matchedChannelLabel}(${matchedDataType}) for robot ${this.config.robotId}`)
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
    this.channelDataTypes.clear()

    // VideoStore 정리
    const videoStoreManager = VideoStoreManager.getInstance()
    videoStoreManager.cleanupRobotVideoStores(this.config.robotId)

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

  // 모든 데이터 채널 목록 반환
  public getDataChannels(): Map<string, RTCDataChannel> {
    return this.dataChannels
  }

  // 채널별 데이터 타입 반환
  public getChannelDataType(channelLabel: string): string | undefined {
    return this.channelDataTypes.get(channelLabel)
  }

  // 특정 데이터 타입을 처리하는 채널들 반환
  public getChannelsByDataType(dataType: string): string[] {
    const channels: string[] = []
    this.channelDataTypes.forEach((type, label) => {
      if (type === dataType) {
        channels.push(label)
      }
    })
    return channels
  }

  // 비디오 스토어 가져오기
  public getVideoStore(channelLabel: string): VideoStore | undefined {
    const videoStoreManager = VideoStoreManager.getInstance()
    return videoStoreManager.getVideoStore(this.config.robotId, channelLabel)
  }

  // 모든 비디오 스토어 가져오기
  public getVideoStores(): Map<string, VideoStore> {
    const videoStoreManager = VideoStoreManager.getInstance()
    return videoStoreManager.getRobotVideoStores(this.config.robotId)
  }

  // 비디오 채널 목록 반환
  public getVideoChannels(): string[] {
    const videoStoreManager = VideoStoreManager.getInstance()
    return videoStoreManager.getRobotVideoChannels(this.config.robotId)
  }

  // 비디오 채널 설정 가져오기
  public getVideoChannelConfig(channelLabel: string): VideoChannelConfig | undefined {
    return this.videoChannels.get(channelLabel)
  }

  // 모든 비디오 채널 설정 반환
  public getVideoChannelConfigs(): Map<string, VideoChannelConfig> {
    return this.videoChannels
  }

  // 비디오 채널의 데이터 타입 반환
  public getVideoChannelDataType(channelLabel: string): string | undefined {
    return this.videoChannelDataTypes.get(channelLabel)
  }

  // 특정 데이터 타입을 처리하는 비디오 채널들 반환
  public getVideoChannelsByDataType(dataType: string): string[] {
    const channels: string[] = []
    this.videoChannelDataTypes.forEach((type, label) => {
      if (type === dataType) {
        channels.push(label)
      }
    })
    return channels
  }
}
