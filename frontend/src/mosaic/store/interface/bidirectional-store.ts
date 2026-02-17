import type {UnsubscribeFunction} from "./connection-subscribable.ts"
import {MosaicStore} from "./mosaic-store.ts"

type Subscriber = (data: ArrayBuffer) => Promise<void>

export abstract class BidirectionalStore<V> extends MosaicStore {
  protected dataChannel: RTCDataChannel | null = null
  private subscriberList: Map<string, Subscriber> = new Map()

  public getStoreType(): "bidirectional" {
    return "bidirectional"
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
          console.error(
            "BidirectionalStore Subscriber notification failed:",
            error,
          )
        }
      },
    )
    await Promise.all(promises)
  }

  // Can be overridden by subclasses
  public onSubscriberAdded(_subscriber: Subscriber): void {
  }

  // Can be overridden by subclasses
  public onSubscriberRemoved(_subscriber: Subscriber): void {
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
