import type { UnsubscribeFunction } from "./connection-subscribable.ts"
import { MosaicStore } from "./mosaic-store.ts"

type Subscriber<V> = (data: V) => void | Promise<void>

export abstract class ReceivableStore<V> extends MosaicStore {
  public isParallelReceivable = false

  private subscriberList: Map<string, Subscriber<V>> = new Map()

  public getStoreType(): "receivable" {
    return "receivable"
  }

  public subscribe(
    subscriber: (data: V) => void | Promise<void>,
  ): UnsubscribeFunction {
    const id = crypto.randomUUID()
    this.subscriberList.set(id, subscriber)
    this.onSubscriberAdded(subscriber)
    return () => this.removeSubscriber(id)
  }

  public async notifySubscribers(data: ArrayBuffer | string): Promise<void> {
    const promises = Array.from(this.subscriberList.values()).map(
      async (sub) => {
        // Prevent one subscriber error from aborting the rest
        try {
          const convertedData = this.convertData(data)
          if (convertedData instanceof Promise) {
            await sub(await convertedData)
            return
          }
          await sub(convertedData)
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

  public abstract convertData(data: ArrayBuffer | string): V | Promise<V>

  // Can be overridden by subclasses
  public onSubscriberAdded(_subscriber: Subscriber<V>): void {}

  // Can be overridden by subclasses
  public onSubscriberRemoved(_subscriber: Subscriber<V>): void {}

  private removeSubscriber(subscriberId: string): void {
    const subscriber = this.subscriberList.get(subscriberId)
    if (subscriber) {
      this.subscriberList.delete(subscriberId)
      this.onSubscriberRemoved(subscriber)
    }
  }
}
