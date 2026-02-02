export type Subscriber = (robotId: string) => void
export type UnsubscribeFunction = () => void

export abstract class ConnectionSubscribable {
  private beforeConnectedSubscriberList: Map<string, Subscriber> = new Map()
  private afterConnectedSubscriberList: Map<string, Subscriber> = new Map()
  private afterDisconnectedSubscriberList: Map<string, Subscriber> = new Map()
  private afterConnectionFailedSubscriberList: Map<string, Subscriber> =
    new Map()

  public onBeforeConnected(
    subscriber: (robotId: string) => void,
  ): UnsubscribeFunction {
    // TODO: implement
    throw new Error("Not implemented")
  }

  public onAfterConnected(
    subscriber: (robotId: string) => void,
  ): UnsubscribeFunction {
    // TODO: implement
    throw new Error("Not implemented")
  }

  public onAfterDisconnected(
    subscriber: (robotId: string) => void,
  ): UnsubscribeFunction {
    // TODO: implement
    throw new Error("Not implemented")
  }

  public onAfterConnectionFailed(
    subscriber: (robotId: string) => void,
  ): UnsubscribeFunction {
    // TODO: implement
    throw new Error("Not implemented")
  }

  public notifyBeforeConnected(robotId: string): void {
    // TODO: implement
  }

  public notifyAfterConnected(robotId: string): void {
    // TODO: implement
  }

  public notifyAfterDisconnected(robotId: string): void {
    // TODO: implement
  }

  public notifyAfterConnectionFailed(robotId: string): void {
    // TODO: implement
  }

  protected abstract beforeConnected(robotId: string): void

  protected abstract afterConnected(robotId: string): void

  protected abstract afterDisconnected(robotId: string): void

  protected abstract afterConnectionFailed(robotId: string): void
}
