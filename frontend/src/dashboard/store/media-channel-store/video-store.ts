export type VideoSubscriber = (videoData: VideoData) => void
export type StreamStatsSubscriber = (stats: StreamStats) => void

export interface VideoData {
  streamId: string
  robotId: string
  channelLabel: string
  mediaStream: MediaStream | null
  isActive: boolean
  timestamp: number
  metadata?: { mediaType?: string; source?: string }
}

export interface StreamStats {
  fps: number
  fpsDatas: number[]
  width: number
  height: number
  jitter: number
  jitterDatas: number[]
  rtt: number
  rttDatas: number[]
}

export function getInitialVideoData(): VideoData {
  return {
    streamId: "-",
    robotId: "-",
    channelLabel: "-",
    mediaStream: null,
    isActive: false,
    timestamp: Date.now(),
  }
}

export function getInitialStreamStats(): StreamStats {
  return {
    fps: 0,
    fpsDatas: [],
    width: 0,
    height: 0,
    jitter: 0,
    jitterDatas: [],
    rtt: 0,
    rttDatas: [],
  }
}

export class VideoStore {
  protected robotId: string
  protected channelLabel: string
  protected mediaStream: MediaStream | null = null
  protected videoElement: HTMLVideoElement | null = null
  protected subscribers: Set<VideoSubscriber> = new Set()
  protected streamStatsSubscribers: Set<StreamStatsSubscriber> = new Set()
  protected isActive = false
  protected streamStats: StreamStats = getInitialStreamStats()
  protected metadata: { mediaType?: string; source?: string } = {}

  protected pc: RTCPeerConnection | null = null
  protected mediaStreamTrack: MediaStreamTrack | null = null
  protected statsReportInterval: NodeJS.Timeout | null = null

  constructor(robotId: string, channelLabel: string) {
    this.robotId = robotId
    this.channelLabel = channelLabel
  }

  setPeerConnection(pc: RTCPeerConnection | null): void {
    if (pc !== null) {
      this.pc = pc
    }
  }

  setMediaStreamTrack(track: MediaStreamTrack | null): void {
    if (track !== null) {
      this.mediaStreamTrack = track
    }
  }

  // Metadata setter (simplified metadata)
  setMetadata(metadata: { mediaType?: string; source?: string }): void {
    this.metadata = {...this.metadata, ...metadata}
  }

  // Metadata getter (simplified metadata)
  getMetadata(): { mediaType?: string; source?: string } {
    return this.metadata
  }

  // Subscriber management
  subscribe(callback: VideoSubscriber): () => void {
    this.subscribers.add(callback)
    return () => {
      this.subscribers.delete(callback)
    }
  }

  subscribeStreamStats(callback: StreamStatsSubscriber): () => void {
    this.streamStatsSubscribers.add(callback)
    return () => {
      this.streamStatsSubscribers.delete(callback)
    }
  }

  // Set MediaStream
  setMediaStream(stream: MediaStream): void {
    this.mediaStream = stream
    this.isActive = stream.active

    // Connect stream to video element
    if (this.videoElement) {
      this.videoElement.srcObject = stream
      this.startStatsReporting()
    }

    // Notify subscribers immediately
    this.notifySubscribers()
  }

  // Set video element
  setVideoElement(videoElement: HTMLVideoElement): void {
    this.videoElement = videoElement

    if (this.mediaStream) {
      this.videoElement.srcObject = this.mediaStream
      this.startStatsReporting()
    }
  }

  // Get MediaStream
  getMediaStream(): MediaStream | null {
    return this.mediaStream
  }

  // Get stream statistics
  getStreamStats(): StreamStats {
    return this.streamStats
  }

  // Get channel label
  getChannelLabel(): string {
    return this.channelLabel
  }

  // Get active status
  isStreamActive(): boolean {
    return this.isActive
  }

  protected startStatsReporting(): void {
    this.stopStatsReporting()

    this.statsReportInterval = setInterval(async () => {
      await this.statsReporting()
    }, 1000)
  }

  protected stopStatsReporting(): void {
    if (this.statsReportInterval) {
      clearInterval(this.statsReportInterval)
      this.statsReportInterval = null
    }
  }

  protected async statsReporting(): Promise<void> {
    if (this.pc === null || this.pc === undefined) {
      return
    }

    const stats = await this.pc.getStats(this.mediaStreamTrack)

    stats.forEach((report) => {
      if (report.type === "inbound-rtp" && report.kind === "video") {
        const fps = report.framesPerSecond || 0
        const width = report.frameWidth || 0
        const height = report.frameHeight || 0
        const jitter = report.jitter || 0

        this.streamStats.fps = fps
        // this.streamStats.fpsDatas.push(fps)
        this.streamStats.width = width
        this.streamStats.height = height
        this.streamStats.jitter = jitter
        // this.streamStats.jitterDatas.push(jitter)
      }

      // if (report.type === "remote-outbound-rtp") {
      //   this.streamStats.rtt = report.timestamp - report.remoteTimestamp
      //   this.streamStats.rttDatas.push(this.streamStats.rtt)
      // } else {
      //   if (report.type === "candidate-pair" && report.state === "succeeded") {
      //     this.streamStats.rtt = report.currentRoundTripTime * 1000
      //     this.streamStats.rttDatas.push(this.streamStats.rtt)
      //   }
      // }
    })

    this.notifyStreamStatsSubscribers()
  }

  // Notify subscribers
  protected notifySubscribers(): void {
    if (!this.mediaStream) {
      return
    }

    const videoData: VideoData = {
      streamId: this.mediaStream.id,
      robotId: this.robotId,
      channelLabel: this.channelLabel,
      mediaStream: this.mediaStream,
      isActive: this.isActive,
      timestamp: Date.now(),
      metadata: this.metadata,
    }

    this.subscribers.forEach((callback) => {
      try {
        callback(videoData)
      } catch (error) {
        console.error(
          `VideoStore[${this.channelLabel}] Subscriber callback error:`,
          error,
        )
      }
    })
  }

  protected notifyStreamStatsSubscribers(): void {
    this.streamStatsSubscribers.forEach((callback) => {
      try {
        callback(this.streamStats)
      } catch (error) {
        console.error(
          `VideoStore[${this.channelLabel}] StreamStats subscriber callback error:`,
          error,
        )
      }
    })
  }

  // Cleanup
  destroy(): void {
    this.stopStatsReporting()

    console.log(
      "Robot: ",
      this.robotId,
      "Channel: ",
      this.channelLabel,
      "Stats: ",
      this.streamStats,
    )

    this.isActive = false
    this.notifySubscribers()

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop())
      this.mediaStream = null
    }

    if (this.videoElement) {
      this.videoElement.srcObject = null
      this.videoElement = null
    }

    this.subscribers.clear()

    this.streamStats = getInitialStreamStats()
  }

  // Internal access methods (used by child classes)
  public getRobotId(): string {
    return this.robotId
  }

  public getVideoElement(): HTMLVideoElement | null {
    return this.videoElement
  }

  public getSubscribers(): Set<VideoSubscriber> {
    return this.subscribers
  }

  public getIsActive(): boolean {
    return this.isActive
  }

  public getStreamStatsInternal(): StreamStats {
    return this.streamStats
  }

  public setStreamStats(stats: StreamStats): void {
    this.streamStats = stats
    this.notifyStreamStatsSubscribers()
  }
}
