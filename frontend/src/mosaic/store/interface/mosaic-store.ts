import type {RobotConnector} from "@/mosaic"
import {ConnectionSubscribable} from "./connection-subscribable.ts"

export abstract class MosaicStore extends ConnectionSubscribable {
  protected dataType = "undefined"

  protected robotConnector: RobotConnector

  constructor(robotConnector: RobotConnector) {
    super()
    this.robotConnector = robotConnector
  }

  public getDataType(): string {
    return this.dataType
  }

  public abstract getStoreType():
    | "receivable"
    | "sendable"
    | "bidirectional"
    | "media"

  public getRobotConnector(): RobotConnector {
    return this.robotConnector
  }
}
