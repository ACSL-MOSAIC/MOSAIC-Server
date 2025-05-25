import { createControlChannel, sendControlCommand, sendConnectionCheck } from "./control"
import { setupPositionChannel } from "./position"

export interface WebRTCConnectionConfig {
  userId: string
  robotId: string
  videoRef: React.RefObject<HTMLVideoElement>
  canvasRef: React.RefObject<HTMLCanvasElement>
  positionElementRef: React.RefObject<HTMLElement>
  onConnectionStateChange?: (isConnected: boolean) => void
  onFpsChange?: (fps: number) => void
  onError?: (error: Error) => void
}

export class WebRTCConnection {
  private peerConnection: RTCPeerConnection | null = null
  private dataChannel: RTCDataChannel | null = null
  private fpsInterval: NodeJS.Timeout | null = null
  private frameCount: number = 0
  private lastConnectionCheckTime: number | null = null
  private connectionCheckInterval: NodeJS.Timeout | null = null
  private pendingCandidates: RTCIceCandidate[] = []
  private config: WebRTCConnectionConfig

  constructor(config: WebRTCConnectionConfig) {
    this.config = config
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
    return new RTCPeerConnection(configuration)
  }

  private updateFPS(): void {
    const currentFPS = this.frameCount
    this.config.onFpsChange?.(currentFPS)
    this.frameCount = 0
  }

  private handleTrack(event: RTCTrackEvent): void {
    if (!this.config.videoRef.current) return

    this.config.videoRef.current.srcObject = event.streams[0]

    this.config.videoRef.current.onloadedmetadata = () => {
      this.frameCount = 0

      if ('requestVideoFrameCallback' in HTMLVideoElement.prototype) {
        const countFrames = () => {
          this.frameCount++
          this.config.videoRef.current?.requestVideoFrameCallback(countFrames)
        }
        if (this.config.videoRef.current) {
          this.config.videoRef.current.requestVideoFrameCallback(countFrames)
        }
      } else {
        if (this.config.videoRef.current) {
          this.config.videoRef.current.addEventListener('timeupdate', () => {
            this.frameCount++
          })
        }
      }

      this.fpsInterval = setInterval(() => this.updateFPS(), 1000)
    }

    this.config.videoRef.current.onended = () => {
      if (this.fpsInterval) {
        clearInterval(this.fpsInterval)
        this.fpsInterval = null
      }
    }
  }

  private connectionCheck(): void {
    const currentTime = Date.now()
    if (this.lastConnectionCheckTime && (currentTime - this.lastConnectionCheckTime) < 10000) {
      this.config.onConnectionStateChange?.(true)
    }

    if (this.dataChannel?.readyState === 'open') {
      sendConnectionCheck(this.dataChannel, this.config.userId, this.config.robotId)
    }
  }

  public async startConnection(): Promise<RTCSessionDescriptionInit> {
    try {
      this.peerConnection = this.createPeerConnection()

      this.peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          this.pendingCandidates.push(event.candidate)
        }
      }

      this.peerConnection.ontrack = (event) => this.handleTrack(event)

      this.dataChannel = createControlChannel(this.peerConnection)
      this.dataChannel.onopen = () => {
        this.config.onConnectionStateChange?.(true)
      }

      this.dataChannel.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.type === 'connection_check') {
            this.lastConnectionCheckTime = Date.now()
          }
        } catch (error) {
          console.error('Error parsing control data:', error)
        }
      }

      this.peerConnection.ondatachannel = (event) => {
        const channel = event.channel
        if (channel.label === 'position_data_channel' && 
            this.config.canvasRef.current && 
            this.config.positionElementRef.current) {
          setupPositionChannel(channel, {
            canvas: this.config.canvasRef.current,
            positionElement: this.config.positionElementRef.current
          })
        }
      }

      this.peerConnection.addTransceiver('video', {direction: 'sendrecv'})
      
      const offer = await this.peerConnection.createOffer()
      await this.peerConnection.setLocalDescription(offer)

      this.connectionCheckInterval = setInterval(() => this.connectionCheck(), 5000)

      return offer
    } catch (error) {
      this.config.onError?.(error instanceof Error ? error : new Error(String(error)))
      throw error
    }
  }

  public async setRemoteDescription(description: RTCSessionDescription): Promise<void> {
    if (!this.peerConnection) {
      throw new Error("PeerConnection이 초기화되지 않았습니다.")
    }

    try {
      await this.peerConnection.setRemoteDescription(description)
      
      // 캐시된 ICE Candidate들을 적용
      if (this.pendingCandidates.length > 0) {
        for (const candidate of this.pendingCandidates) {
          try {
            await this.peerConnection.addIceCandidate(candidate)
          } catch (error) {
            console.error("ICE Candidate 적용 실패:", error)
          }
        }
        this.pendingCandidates = []
      }
    } catch (error) {
      throw error
    }
  }

  public async addIceCandidate(candidate: RTCIceCandidate): Promise<void> {
    if (!this.peerConnection) {
      throw new Error("PeerConnection이 초기화되지 않았습니다.")
    }

    try {
      if (this.peerConnection.remoteDescription) {
        await this.peerConnection.addIceCandidate(candidate)
      } else {
        this.pendingCandidates.push(candidate)
      }
    } catch (error) {
      throw error
    }
  }

  public disconnect(): void {
    if (this.connectionCheckInterval) {
      clearInterval(this.connectionCheckInterval)
      this.connectionCheckInterval = null
    }
    if (this.fpsInterval) {
      clearInterval(this.fpsInterval)
      this.fpsInterval = null
    }
    if (this.dataChannel) {
      this.dataChannel.close()
      this.dataChannel = null
    }
    if (this.peerConnection) {
      this.peerConnection.close()
      this.peerConnection = null
    }
    this.config.onConnectionStateChange?.(false)
  }

  public sendControlData(direction: 'up' | 'down' | 'left' | 'right'): void {
    if (this.dataChannel?.readyState === 'open') {
      sendControlCommand(this.dataChannel, direction)
    }
  }

  public getPeerConnection(): RTCPeerConnection | null {
    return this.peerConnection
  }

  public getDataChannel(): RTCDataChannel | null {
    return this.dataChannel
  }
} 