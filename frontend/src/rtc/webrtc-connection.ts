import { WebSocketContextType } from "@/contexts/WebSocketContext"
import { setupWebSocketHandlers, sendWebSocketMessage } from "./ws-adaptor"
import { createDataChannel, cleanupAllDataChannels } from "./webrtc-utils"
import { VideoStoreManager } from "@/dashboard/store/media-channel-store/video-store-manager"
import { VideoStore } from "@/dashboard/store/media-channel-store/video-store"
import { ChannelType, DEFAULT_DATA_CHANNELS, DataChannelConfigUtils } from "./webrtc-datachannel-config"
import { createOfferWithMediaChannels, parseMetadataFromSdp } from "./webrtc-sdp-utils"
import { MediaChannelConfigUtils } from "./webrtc-media-channel-config"

export interface DataChannelConfig {
  label: string
  dataType: string // 'turtlesim_position', 'go2_low_state', 'go2_ouster_pointcloud' 등
  channelType: ChannelType // 채널 타입 명시
  options?: RTCDataChannelInit
}

export interface VideoChannelConfig {
  label: string
  dataType: string // 'turtlesim_video' 등
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
  private channelDataTypes: Map<string, { dataType: string; channelType: ChannelType }> = new Map() // 채널 라벨 -> 데이터 타입 및 채널 타입 매핑
  private videoChannels: Map<string, VideoChannelConfig> = new Map() // 비디오 채널 설정
  private videoChannelDataTypes: Map<string, string> = new Map() // 비디오 채널 라벨 -> 데이터 타입 매핑
  private lastSdpMetadata: Map<string, any> = new Map() // SDP Answer에서 파싱된 메타데이터 저장

  constructor(config: WebRTCConnectionConfig) {
    this.config = config
    this.setupWebSocketHandlers()
  }

  private setupWebSocketHandlers() {
    const { unsubscribe } = setupWebSocketHandlers(this.config.ws, this.config.robotId, {
      onSdpAnswer: async (sdpAnswer) => {
        try {
          // SDP Answer에서 메타데이터와 msid 파싱
          const metadata = parseMetadataFromSdp(sdpAnswer)
          
          // 메타데이터 저장
          this.lastSdpMetadata = metadata
          
          console.log('📥 SDP Answer 메타데이터:', Object.fromEntries(metadata))
          
          // ontrack 핸들러 설정 (메타데이터 기반)
          this.setupVideoTrackHandler(metadata)
          
          await this.setRemoteDescription(new RTCSessionDescription({
            type: 'answer',
            sdp: sdpAnswer
          }))
          
          // SDP answer가 설정된 후에 pending된 ICE candidates 적용
          if (this.pendingCandidates.length > 0) {
            for (const candidate of this.pendingCandidates) {
              try {
                await this.addIceCandidate(candidate)
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
      console.log('📊 DataChannel 수신됨:', dataChannel.label, dataChannel.readyState)
      
      // 수신된 채널의 데이터 타입을 찾기
      const channelInfo = this.channelDataTypes.get(dataChannel.label)
      const dataType = channelInfo?.dataType
      const channelType = channelInfo?.channelType
      
      console.log('🔍 채널 정보 검색:', {
        label: dataChannel.label,
        found: !!dataType,
        dataType: dataType,
        channelType: channelType
      })
      
      if (!dataType) {
        console.error(`등록되지 않은 채널 수신됨: ${dataChannel.label}`)
        console.log('등록된 채널들:', Array.from(this.channelDataTypes.keys()))
        console.log('등록된 채널 상세 정보:', Array.from(this.channelDataTypes.entries()))
        return
      }
      
      console.log('✅ DataChannel 설정 완료:', {
        label: dataChannel.label,
        dataType: dataType,
        channelType: channelType || 'readonly'
      })
      
      this.setupDataChannel(dataChannel, dataType, channelType || 'readonly')
    }

    // 설정된 데이터 채널들 생성
    const channelsToCreate = this.config.dataChannels || []
    
    // 기본 채널들 추가 (설정에 없는 경우)
    const allChannels = [...channelsToCreate, ...DEFAULT_DATA_CHANNELS.filter(ch => 
      !channelsToCreate.some(configured => configured.label === ch.label)
    )]

    console.log('DataChannel 생성 시작:', allChannels.map(ch => `${ch.label}(${ch.dataType})`))
    
    // 여러 데이터 채널 생성
    allChannels.forEach(channelConfig => {
      const dataChannel = peerConnection.createDataChannel(channelConfig.label, {
        ordered: true,
        ...channelConfig.options
      })
      
      console.log('DataChannel 생성됨:', dataChannel.label, dataChannel.readyState, '데이터타입:', channelConfig.dataType, '채널타입:', channelConfig.channelType)
      
      // 채널과 데이터 타입, 채널 타입 매핑 저장
      this.channelDataTypes.set(channelConfig.label, {
        dataType: channelConfig.dataType,
        channelType: channelConfig.channelType
      })
      
      // 생성된 채널 설정
      this.setupDataChannel(dataChannel, channelConfig.dataType, channelConfig.channelType)
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

  private setupDataChannel(dataChannel: RTCDataChannel, dataType: string, channelType: 'readonly' | 'writeonly') {
    console.log('DataChannel 설정 시작:', dataChannel.label, '데이터타입:', dataType, '채널타입:', channelType)
    
    // DataChannel 상태 변경 이벤트 핸들러
    dataChannel.onopen = () => {
      console.log(`DataChannel ${dataChannel.label} 열림, 상태:`, dataChannel.readyState, '데이터타입:', dataType, '채널타입:', channelType)
    }

    dataChannel.onclose = () => {
      console.log(`DataChannel ${dataChannel.label} 닫힘, 상태:`, dataChannel.readyState)
      this.dataChannels.delete(dataChannel.label)
      this.channelDataTypes.delete(dataChannel.label)
    }

    dataChannel.onerror = (error) => {
      console.error(`DataChannel ${dataChannel.label} 에러:`, error)
    }

    createDataChannel(dataChannel, this.config.robotId, dataType, channelType)

    // DataChannel 저장
    this.dataChannels.set(dataChannel.label, dataChannel)
    console.log('DataChannel 설정 완료:', dataChannel.label, '데이터타입:', dataType, '채널타입:', channelType)
  }

  // 메타데이터 기반 Video Track 핸들러 설정
  private setupVideoTrackHandler(metadata: Map<string, any>): void {
    if (!this.peerConnection) {
      console.error('PeerConnection이 초기화되지 않았습니다.')
      return
    }

    console.log('🔧 Video Track Handler 설정 시작:', {
      robotId: this.config.robotId,
      metadata: Object.fromEntries(metadata)
    })

    this.peerConnection.ontrack = (event) => {
      
      if (event.track.kind === 'video') {
        
        if (event.streams && event.streams[0]) {
          const stream = event.streams[0]
          
          // MSID에서 추출한 미디어 타입 사용
          const mediaType = metadata.get('mediaType') || 'turtlesim_video'

          // 미디어 타입이 지원되는지 확인
          if (MediaChannelConfigUtils.isSupportedMediaType(mediaType)) {
          
            // VideoStore 생성 및 연결
            const videoStoreManager = VideoStoreManager.getInstance()
            const videoStore = videoStoreManager.createVideoStoreByMediaTypeAuto(
              this.config.robotId, 
              mediaType
            )
            
            if (videoStore) {
              // 간소화된 메타데이터 설정 (MSID 기반)
              videoStore.setMetadata({
                mediaType,
                source: 'robot_stream'
              })
              
              videoStore.setMediaStream(stream)
              console.log(`Video Store connected: ${mediaType} for robot ${this.config.robotId}`)
            } else {
              console.warn(`Video Store not found: ${mediaType} for robot ${this.config.robotId}`)
            }
          } else {
            console.warn(`Unsupported media type: ${mediaType}`)
            console.log('Supported media types:', MediaChannelConfigUtils.getSupportedMediaTypes())
          }
        } else {
          console.warn('Video track has no stream')
        }
      } else {
        console.log('Ignore non-video track:', event.track.kind)
      }
    }
    
    console.log('Video Track Handler setup completed')
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
      console.log('PeerConnection created:', this.peerConnection)

      // 이벤트 핸들러 설정
      this.peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          console.log('ICE candidate created:', event.candidate)
          sendWebSocketMessage(this.config.ws, {
            type: "send_ice_candidate",
            robot_id: this.config.robotId,
            ice_candidate: event.candidate
          })
        }
      }

      this.peerConnection.oniceconnectionstatechange = () => {
        console.log('ICE connection state changed:', this.peerConnection?.iceConnectionState)
        const isConnected = this.peerConnection?.iceConnectionState === 'connected'
        console.log('Connection state:', isConnected ? '✅ connected' : '❌ disconnected')
        this.config.onConnectionStateChange?.(isConnected)
      }

      this.peerConnection.onsignalingstatechange = () => {
        console.log('Signaling state changed:', this.peerConnection?.signalingState)
      }

      this.peerConnection.onconnectionstatechange = () => {
        console.log('Connection state changed:', this.peerConnection?.connectionState)
      }

      this.peerConnection.ondatachannel = (event) => {
        console.log('DataChannel received:', event.channel.label, event.channel.readyState)
      }

      // Offer 생성 및 설정 - 미디어 채널 설정 적용
      console.log('Offer creation started')
      
      // 활성화된 미디어 채널 목록 가져오기
      const activeMediaChannels = MediaChannelConfigUtils.getActiveMediaChannels()
      console.log('Active media channels:', activeMediaChannels)
      
      // 미디어 채널 설정이 적용된 Offer 생성
      const offer = await createOfferWithMediaChannels(
        this.peerConnection,
        activeMediaChannels
      )
      
      console.log('Offer created (media channel settings applied):', offer)
      
      await this.peerConnection.setLocalDescription(offer)
      console.log('Local description set:', this.peerConnection.localDescription)

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
      console.error('PeerConnection not initialized')
      throw new Error("PeerConnection not initialized")
    }

    try {
      console.log('Remote description setting started:', description)
      await this.peerConnection.setRemoteDescription(description)
      console.log('Remote description set')
    } catch (error) {
      console.error('Remote description setting failed:', error)
      throw error
    }
  }

  public async addIceCandidate(candidate: RTCIceCandidate): Promise<void> {
    if (!this.peerConnection) {
      console.error('PeerConnection not initialized')
      throw new Error("PeerConnection not initialized")
    }

    try {
      await this.peerConnection.addIceCandidate(candidate)
      console.log('ICE candidate applied')
    } catch (error) {
      console.error('ICE candidate addition failed:', error)
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
    this.lastSdpMetadata.clear()
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
    return this.channelDataTypes.get(channelLabel)?.dataType
  }

  // 특정 데이터 타입을 처리하는 채널들 반환
  public getChannelsByDataType(dataType: string): string[] {
    const channels: string[] = []
    this.channelDataTypes.forEach((type, label) => {
      if (type.dataType === dataType) {
        channels.push(label)
      }
    })
    return channels
  }

  // 비디오 스토어 매니저 가져오기
  public getVideoStoreManager(): VideoStoreManager {
    return VideoStoreManager.getInstance()
  }
}
