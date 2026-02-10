import {MosaicStore} from "./mosaic-store.ts"

export abstract class SendableStore<V> extends MosaicStore {
  protected dataChannel: RTCDataChannel | null = null

  public getStoreType(): "sendable" {
    return "sendable"
  }

  public abstract add(data: V): void

  public setDataChannel(channel: RTCDataChannel): void {
    this.dataChannel = channel
  }

  protected sendData(data: string): void {
    if (this.dataChannel && this.dataChannel.readyState === "open") {
      this.dataChannel.send(data)
    } 
    else{
      console.warn("SendableStore DataChannel is not open!")
    }
  }
}
