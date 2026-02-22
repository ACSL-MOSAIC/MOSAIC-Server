import { MosaicStore } from "./mosaic-store.ts"

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
}
