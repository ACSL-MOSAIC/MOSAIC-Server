import { MosaicStore } from "./mosaic-store.ts"

export interface StreamStats {
  fps: number
  jitter: number
  rtt: number
}

export class MediaStreamStore extends MosaicStore {
  static readonly connectorType: string = "media"
  protected connectorType = "media"
  // @ts-ignore
  private pc: RTCPeerConnection | null = null
  // @ts-ignore
  private mediaStreamTrack: MediaStreamTrack | null = null
  private mediaStream: MediaStream | null = null
  private videoElement: HTMLVideoElement | null = null

  public getStoreType(): "media" {
    return "media"
  }

  public setPeerConnection(pc: RTCPeerConnection): void {
    this.pc = pc
  }

  public setMediaStreamTrack(track: MediaStreamTrack): void {
    this.mediaStreamTrack = track
  }

  public setMediaStream(stream: MediaStream): void {
    this.mediaStream = stream
  }

  public getMediaStream(): MediaStream | null {
    return this.mediaStream
  }

  setVideoElement(videoElement: HTMLVideoElement): void {
    this.videoElement = videoElement

    if (this.mediaStream) {
      this.videoElement.srcObject = this.mediaStream
      // this.startStatsReporting()
    }
  }

  public async getStats(): Promise<StreamStats | null> {
    if (this.pc === null || this.pc === undefined) {
      return null
    }

    const streamStats = {
      fps: 0,
      jitter: 0,
      rtt: 0,
    }

    const stats = await this.pc.getStats(this.mediaStreamTrack)
    stats.forEach((report) => {
      if (report.type === "inbound-rtp" && report.kind === "video") {
        const fps = report.framesPerSecond || 0
        const jitter = report.jitter || 0

        streamStats.fps = fps
        streamStats.jitter = jitter
      }

      if (report.type === "remote-outbound-rtp") {
        streamStats.rtt = report.timestamp - report.remoteTimestamp
      } else {
        if (report.type === "candidate-pair" && report.state === "succeeded") {
          streamStats.rtt = report.currentRoundTripTime * 1000
        }
      }
    })

    return streamStats
  }
}
