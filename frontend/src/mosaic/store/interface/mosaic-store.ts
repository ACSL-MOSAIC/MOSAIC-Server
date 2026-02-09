import type {RobotConnector} from "@/mosaic"
import {ConnectionSubscribable} from "./connection-subscribable.ts"

export abstract class MosaicStore extends ConnectionSubscribable {
  protected static dataType: string

  protected robotConnector: RobotConnector

  constructor(robotConnector: RobotConnector) {
    super()
    this.robotConnector = robotConnector
  }

  public static getDataType(): string {
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
