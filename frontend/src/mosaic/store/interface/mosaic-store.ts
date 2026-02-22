import type { RobotConnector } from "@/mosaic"
import type { ChannelRequirement } from "@/mosaic/channel"
import { ConnectionSubscribable } from "./connection-subscribable.ts"

export type StoreType = "receivable" | "sendable" | "media"

export abstract class MosaicStore extends ConnectionSubscribable {
  static readonly connectorType: string = "undefined"
  protected connectorType = "undefined"

  protected robotConnector: RobotConnector

  constructor(robotConnector: RobotConnector) {
    super()
    this.robotConnector = robotConnector
  }

  public getConnectorType(): string {
    return this.connectorType
  }

  public getChannelRequirements(
    robotConnector: RobotConnector,
  ): ChannelRequirement[] {
    return [
      {
        robotConnector: robotConnector,
        store: this,
      },
    ]
  }

  public abstract getStoreType(): StoreType

  public getRobotConnector(): RobotConnector {
    return this.robotConnector
  }
}
