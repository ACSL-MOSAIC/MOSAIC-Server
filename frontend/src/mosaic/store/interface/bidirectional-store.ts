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
    return (this.constructor as typeof BidirectionalStore).isParallelReceivable
  }

  public subscribe(
    subscriber: (data: ArrayBuffer) => Promise<void>,
  ): UnsubscribeFunction {
    const id = crypto.randomUUID()
    this.subscriberList.set(id, subscriber)
    this.onSubscriberAdded(subscriber)
    return () => this.removeSubscriber(id)
  }

  public async notifySubscribers(data: ArrayBuffer): Promise<void> {
    const promises = Array.from(this.subscriberList.values()).map(
      async (sub) => {
        try {
          await sub(data)
        } catch (error) {
          console.error("BidirectionalStore Subscriber notification failed:", error)
        }
      },
    )
    await Promise.all(promises)
  }
  

  public abstract onSubscriberAdded(subscriber: Subscriber): void

  public abstract onSubscriberRemoved(subscriber: Subscriber): void

  public abstract add(data: V): void

  public setDataChannel(channel: RTCDataChannel): void {
    this.dataChannel = channel
  }

  protected sendData(data: string): void {
    if (this.dataChannel && this.dataChannel.readyState === "open") {
      this.dataChannel.send(data)
    } else {
      console.warn(
        "BidirectionalStore DataChannel is not open, cannot send data",
      )
    }
  }

  private removeSubscriber(subscriberId: string): void {
    const subscriber = this.subscriberList.get(subscriberId)
    if (subscriber) {
      this.subscriberList.delete(subscriberId)
      this.onSubscriberRemoved(subscriber)
    }
  }
}
