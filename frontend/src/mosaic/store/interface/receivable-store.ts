import type {UnsubscribeFunction} from "./connection-subscribable.ts"
import {MosaicStore} from "./mosaic-store.ts"

type Subscriber = (data: ArrayBuffer) => Promise<void>

export abstract class ReceivableStore extends MosaicStore {
  protected static isParallelReceivable = false

  private subscriberList: Map<string, Subscriber> = new Map()

  public getStoreType(): "receivable" {
    return "receivable"
  }

  public isParallelReceivable(): boolean {
    return (this.constructor as typeof ReceivableStore).isParallelReceivable
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
    const promises = Array.from(this.subscriberList.values()).map((sub) =>
      sub(data),
    )
    await Promise.all(promises)
  }

  public abstract onSubscriberAdded(subscriber: Subscriber): void

  public abstract onSubscriberRemoved(subscriber: Subscriber): void

  private removeSubscriber(subscriberId: string): void {
    const subscriber = this.subscriberList.get(subscriberId)
    if (subscriber) {
      this.subscriberList.delete(subscriberId)
      this.onSubscriberRemoved(subscriber)
    }
  }
}
