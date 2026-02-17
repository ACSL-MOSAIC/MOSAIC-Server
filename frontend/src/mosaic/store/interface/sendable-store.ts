import {MosaicStore} from "./mosaic-store.ts"

export abstract class SendableStore<V> extends MosaicStore {
  protected dataChannel: RTCDataChannel | null = null

  public getStoreType(): "sendable" {
    return "sendable"
  }

  // Needs to be implemented by subclasses
  public abstract send(data: V): void

  public setDataChannel(channel: RTCDataChannel): void {
    this.dataChannel = channel
  }

  protected sendData(data: string): void {
    if (this.dataChannel && this.dataChannel.readyState === "open") {
      this.dataChannel.send(data)
    } else {
      console.warn("SendableStore DataChannel is not open!")
    }
  }
}
