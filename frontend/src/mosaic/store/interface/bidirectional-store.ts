import type {UnsubscribeFunction} from "./connection-subscribable.ts"
import {MosaicStore} from "./mosaic-store.ts"

type Subscriber = (data: ArrayBuffer) => Promise<void>

export abstract class BidirectionalStore<V> extends MosaicStore {
  protected static isParallelReceivable = false
  protected dataChannel: RTCDataChannel | null = null
  private subscriberList: Map<string, Subscriber> = new Map()

  public getStoreType(): "bidirectional" {
    return "bidirectional"
  }

  public isParallelReceivable(): boolean {
    // TODO: implement
    throw new Error("Not implemented")
  }

  public subscribe(
    subscriber: (data: ArrayBuffer) => Promise<void>,
  ): UnsubscribeFunction {
    // TODO: implement
    throw new Error("Not implemented")
  }

  public async notifySubscribers(data: ArrayBuffer): Promise<void> {
    // TODO: implement
  }

  public abstract onSubscriberAdded(subscriber: Subscriber): void

  public abstract onSubscriberRemoved(subscriber: Subscriber): void

  public abstract add(data: V): void

  public setDataChannel(channel: RTCDataChannel): void {
    // TODO: implement
  }

  protected sendData(data: string): void {
    // TODO: implement
  }

  private removeSubscriber(subscriberId: string): void {
    // TODO: implement
  }
}
