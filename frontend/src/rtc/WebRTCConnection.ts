// import { createControlChannel, sendControlCommand, sendConnectionCheck } from "./control"
// import { setupPositionChannel } from "./position"
// import { setupDataChannel, cleanupAllDataChannels } from "./webrtc-utils"
// import { StoreManager } from "@/dashboard/store/store-manager"

// export interface WebRTCConnectionConfig {
//   userId: string
//   robotId: string
//   videoRef: React.RefObject<HTMLVideoElement>
//   canvasRef: React.RefObject<HTMLCanvasElement>
//   positionElementRef: React.RefObject<HTMLElement>
//   onConnectionStateChange?: (isConnected: boolean) => void
//   onFpsChange?: (fps: number) => void
//   onError?: (error: Error) => void
// }

// export class WebRTCConnection {
//   private peerConnection: RTCPeerConnection | null = null
//   private dataChannel: RTCDataChannel | null = null
//   private fpsInterval: NodeJS.Timeout | null = null
//   private frameCount: number = 0
//   private lastConnectionCheckTime: number | null = null
//   private connectionCheckInterval: NodeJS.Timeout | null = null
//   private pendingCandidates: RTCIceCandidate[] = []
//   private config: WebRTCConnectionConfig
//   private storeManager: StoreManager

//   constructor(config: WebRTCConnectionConfig) {
//     this.config = config
//     this.storeManager = StoreManager.getInstance()
//     // this.storeManager.initializeRobotStores(config.robotId)
//   }

//   private createPeerConnection(): RTCPeerConnection {
//     const configuration = {
//       iceServers: [
//         {
//           urls: "turn:turn.acslgcs.com:3478",
//           username: "gistacsl",
//           credential: "qwqw!12321"
//         }
//       ]
//     }
//     return new RTCPeerConnection(configuration)
//   }

//   private updateFPS(): void {
//     const currentFPS = this.frameCount
//     this.config.onFpsChange?.(currentFPS)
//     this.frameCount = 0
//   }

//   private handleTrack(event: RTCTrackEvent): void {
//     if (!this.config.videoRef.current) return

//     this.config.videoRef.current.srcObject = event.streams[0]

//     this.config.videoRef.current.onloadedmetadata = () => {
//       this.frameCount = 0

//       if ('requestVideoFrameCallback' in HTMLVideoElement.prototype) {
//         const countFrames = () => {
//           this.frameCount++
//           this.config.videoRef.current?.requestVideoFrameCallback(countFrames)
//         }
//         if (this.config.videoRef.current) {
//           this.config.videoRef.current.requestVideoFrameCallback(countFrames)
//         }
//       } else {
//         if (this.config.videoRef.current) {
//           this.config.videoRef.current.addEventListener('timeupdate', () => {
//             this.frameCount++
//           })
//         }
//       }

//       this.fpsInterval = setInterval(() => this.updateFPS(), 1000)
//     }

//     this.config.videoRef.current.onended = () => {
//       if (this.fpsInterval) {
//         clearInterval(this.fpsInterval)
//         this.fpsInterval = null
//       }
//     }
//   }

//   private connectionCheck(): void {
//     const currentTime = Date.now()
//     if (this.lastConnectionCheckTime && (currentTime - this.lastConnectionCheckTime) < 10000) {
//       this.config.onConnectionStateChange?.(true)
//     }

//     if (this.dataChannel?.readyState === 'open') {
//       sendConnectionCheck(this.dataChannel, this.config.userId, this.config.robotId)
//     }
//   }

//   public async startConnection(): Promise<RTCSessionDescriptionInit> {
//     try {
//       // 기존 연결이 있다면 정리
//       if (this.peerConnection) {
//         this.disconnect()
//       }

//       this.peerConnection = this.createPeerConnection()
//       console.log('PeerConnection 생성됨:', this.peerConnection)

//       // 이벤트 핸들러 설정
//       this.peerConnection.onicecandidate = (event) => {
//         if (event.candidate) {
//           console.log('ICE candidate 생성됨:', event.candidate)
//           this.pendingCandidates.push(event.candidate)
//         }
//       }

//       this.peerConnection.oniceconnectionstatechange = () => {
//         console.log('ICE connection state 변경:', this.peerConnection?.iceConnectionState)
//       }

//       this.peerConnection.onsignalingstatechange = () => {
//         console.log('Signaling state 변경:', this.peerConnection?.signalingState)
//       }

//       this.peerConnection.ontrack = (event) => this.handleTrack(event)

//       // Data channel 설정
//       this.dataChannel = createControlChannel(this.peerConnection)
//       this.dataChannel.onopen = () => {
//         console.log('Control channel 열림')
//         this.config.onConnectionStateChange?.(true)
//       }

//       this.dataChannel.onclose = () => {
//         console.log('Control channel 닫힘')
//         this.config.onConnectionStateChange?.(false)
//       }

//       this.dataChannel.onerror = (error) => {
//         console.error('Control channel 에러:', error)
//         this.config.onError?.(new Error('Control channel error'))
//       }

//       this.dataChannel.onmessage = (event) => {
//         try {
//           const data = JSON.parse(event.data)
//           if (data.type === 'connection_check') {
//             this.lastConnectionCheckTime = Date.now()
//           }
//         } catch (error) {
//           console.error('Error parsing control data:', error)
//         }
//       }

//       this.peerConnection.ondatachannel = (event) => {
//         const channel = event.channel
//         console.log('Data channel opened:', channel.label, channel.readyState)
        
//         if (channel.label === 'position_data_channel' && 
//             this.config.canvasRef.current && 
//             this.config.positionElementRef.current) {
//           setupPositionChannel(channel, {
//             canvas: this.config.canvasRef.current,
//             positionElement: this.config.positionElementRef.current
//           })
//         } else if (channel.label === 'go2_low_state_data_channel') {
//           setupDataChannel(channel, this.config.robotId)
//         }

//         channel.onopen = () => {
//           console.log('Data channel ready:', channel.label)
//         }
//         channel.onclose = () => {
//           console.log('Data channel closed:', channel.label)
//         }
//         channel.onerror = (error) => {
//           console.error('Data channel error:', channel.label, error)
//         }
//       }

//       // Video transceiver 추가
//       this.peerConnection.addTransceiver('video', {direction: 'sendrecv'})
      
//       // Offer 생성 및 설정
//       console.log('Offer 생성 시작')
//       const offer = await this.peerConnection.createOffer({
//         offerToReceiveVideo: true,
//         offerToReceiveAudio: false
//       })
//       console.log('Offer 생성됨:', offer)
      
//       await this.peerConnection.setLocalDescription(offer)
//       console.log('Local description 설정됨:', this.peerConnection.localDescription)

//       // 연결 체크 시작
//       this.connectionCheckInterval = setInterval(() => this.connectionCheck(), 5000)

//       return offer
//     } catch (error) {
//       console.error('Connection start error:', error)
//       this.config.onError?.(error instanceof Error ? error : new Error(String(error)))
//       throw error
//     }
//   }

//   public async setRemoteDescription(description: RTCSessionDescription): Promise<void> {
//     if (!this.peerConnection) {
//       console.error('PeerConnection이 초기화되지 않았습니다.')
//       throw new Error("PeerConnection이 초기화되지 않았습니다.")
//     }

//     try {
//       console.log('Remote description 설정 시도:', description)
//       await this.peerConnection.setRemoteDescription(description)
//       console.log('Remote description 설정 완료')
      
//       // 캐시된 ICE Candidate들을 적용
//       if (this.pendingCandidates.length > 0) {
//         console.log('캐시된 ICE candidates 적용:', this.pendingCandidates.length)
//         for (const candidate of this.pendingCandidates) {
//           try {
//             await this.peerConnection.addIceCandidate(candidate)
//             console.log('ICE candidate 적용 성공')
//           } catch (error) {
//             console.error("ICE Candidate 적용 실패:", error)
//           }
//         }
//         this.pendingCandidates = []
//       }
//     } catch (error) {
//       console.error('Remote description 설정 실패:', error)
//       throw error
//     }
//   }

//   public async addIceCandidate(candidate: RTCIceCandidate): Promise<void> {
//     if (!this.peerConnection) {
//       console.error('PeerConnection이 초기화되지 않았습니다.')
//       throw new Error("PeerConnection이 초기화되지 않았습니다.")
//     }

//     try {
//       if (this.peerConnection.remoteDescription) {
//         console.log('ICE candidate 즉시 적용')
//         await this.peerConnection.addIceCandidate(candidate)
//       } else {
//         console.log('ICE candidate 캐시')
//         this.pendingCandidates.push(candidate)
//       }
//     } catch (error) {
//       console.error('ICE candidate 추가 실패:', error)
//       throw error
//     }
//   }

//   public disconnect(): void {
//     if (this.connectionCheckInterval) {
//       clearInterval(this.connectionCheckInterval)
//       this.connectionCheckInterval = null
//     }
//     if (this.fpsInterval) {
//       clearInterval(this.fpsInterval)
//       this.fpsInterval = null
//     }
//     if (this.dataChannel) {
//       this.dataChannel.close()
//       this.dataChannel = null
//     }
//     if (this.peerConnection) {
//       this.peerConnection.close()
//       this.peerConnection = null
//     }
//     this.config.onConnectionStateChange?.(false)
//   }

//   public sendControlData(direction: 'up' | 'down' | 'left' | 'right'): void {
//     if (this.dataChannel?.readyState === 'open') {
//       sendControlCommand(this.dataChannel, direction)
//     }
//   }

//   public getPeerConnection(): RTCPeerConnection | null {
//     return this.peerConnection
//   }

//   public getDataChannel(): RTCDataChannel | null {
//     return this.dataChannel
//   }
// } 