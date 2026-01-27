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

  private removeSubscriber(subscriberId: string): void {
    // TODO: implement
  }
}
