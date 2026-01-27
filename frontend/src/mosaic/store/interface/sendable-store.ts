import {MosaicStore} from "./mosaic-store.ts"

export abstract class SendableStore<V> extends MosaicStore {
  protected dataChannel: RTCDataChannel | null = null

  public getStoreType(): "sendable" {
    return "sendable"
  }

  public abstract add(data: V): void

  public setDataChannel(channel: RTCDataChannel): void {
    // TODO: implement
  }

  protected sendData(data: string): void {
    // TODO: implement
  }
}
