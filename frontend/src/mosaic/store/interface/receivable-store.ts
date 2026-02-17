import type {UnsubscribeFunction} from "./connection-subscribable.ts"
import {MosaicStore} from "./mosaic-store.ts"

type Subscriber = (data: ArrayBuffer) => Promise<void>

export abstract class ReceivableStore extends MosaicStore {
  public isParallelReceivable = false

  private subscriberList: Map<string, Subscriber> = new Map()

  public getStoreType(): "receivable" {
    return "receivable"
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
        // Prevent one subscriber error from aborting the rest
        try {
          await sub(data)
        } catch (error) {
          console.error(
            "ReceivableStore Subscriber notification failed:",
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

  private removeSubscriber(subscriberId: string): void {
    const subscriber = this.subscriberList.get(subscriberId)
    if (subscriber) {
      this.subscriberList.delete(subscriberId)
      this.onSubscriberRemoved(subscriber)
    }
  }
}
