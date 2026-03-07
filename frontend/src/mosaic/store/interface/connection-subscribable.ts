export type Subscriber = (robotId: string) => void;
export type UnsubscribeFunction = () => void;

export abstract class ConnectionSubscribable {
  private beforeConnectedSubscriberList: Map<string, Subscriber> = new Map();
  private afterConnectedSubscriberList: Map<string, Subscriber> = new Map();
  private afterDisconnectedSubscriberList: Map<string, Subscriber> = new Map();
  private afterConnectionFailedSubscriberList: Map<string, Subscriber> = new Map();

  public onBeforeConnected(subscriber: (robotId: string) => void): UnsubscribeFunction {
    const id = crypto.randomUUID();
    this.beforeConnectedSubscriberList.set(id, subscriber);
    return () => this.beforeConnectedSubscriberList.delete(id);
  }

  public onAfterConnected(subscriber: (robotId: string) => void): UnsubscribeFunction {
    const id = crypto.randomUUID();
    this.afterConnectedSubscriberList.set(id, subscriber);
    return () => this.afterConnectedSubscriberList.delete(id);
  }

  public onAfterDisconnected(subscriber: (robotId: string) => void): UnsubscribeFunction {
    const id = crypto.randomUUID();
    this.afterDisconnectedSubscriberList.set(id, subscriber);
    return () => this.afterDisconnectedSubscriberList.delete(id);
  }

  public onAfterConnectionFailed(subscriber: (robotId: string) => void): UnsubscribeFunction {
    const id = crypto.randomUUID();
    this.afterConnectionFailedSubscriberList.set(id, subscriber);
    return () => this.afterConnectionFailedSubscriberList.delete(id);
  }

  public notifyBeforeConnected(robotId: string): void {
    this.beforeConnectedSubscriberList.forEach((sub) => sub(robotId));
    this.beforeConnected(robotId);
  }

  public notifyAfterConnected(robotId: string): void {
    this.afterConnectedSubscriberList.forEach((sub) => sub(robotId));
    this.afterConnected(robotId);
  }

  public notifyAfterDisconnected(robotId: string): void {
    this.afterDisconnectedSubscriberList.forEach((sub) => sub(robotId));
    this.afterDisconnected(robotId);
  }

  public notifyAfterConnectionFailed(robotId: string): void {
    this.afterConnectionFailedSubscriberList.forEach((sub) => sub(robotId));
    this.afterConnectionFailed(robotId);
  }

  // Can be overridden by subclasses
  protected beforeConnected(_robotId: string): void {}

  // Can be overridden by subclasses
  protected afterConnected(_robotId: string): void {}

  // Can be overridden by subclasses
  protected afterDisconnected(_robotId: string): void {}

  // Can be overridden by subclasses
  protected afterConnectionFailed(_robotId: string): void {}
}
