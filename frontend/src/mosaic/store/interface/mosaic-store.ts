import type {RobotConnector} from "@/mosaic"

export abstract class MosaicStore {
  protected static dataType: string

  protected robotConnector: RobotConnector

  constructor(robotConnector: RobotConnector) {
    this.robotConnector = robotConnector
  }

  public static getDataType(): string {
    // TODO: implement
    throw new Error("Not implemented")
  }

  public abstract getStoreType():
    | "receivable"
    | "sendable"
    | "bidirectional"
    | "media"

  public getRobotConnector(): RobotConnector {
    // TODO: implement
    throw new Error("Not implemented")
  }
}
