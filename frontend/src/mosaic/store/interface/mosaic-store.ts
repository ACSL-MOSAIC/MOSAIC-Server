import type { RobotConnector } from "@/mosaic";
import type { ChannelRequirement } from "@/mosaic/channel";

import { ConnectionSubscribable } from "./connection-subscribable.ts";

export type StoreType = "receivable" | "sendable" | "media";

export abstract class MosaicStore extends ConnectionSubscribable {
  protected robotConnector: RobotConnector;

  constructor(robotConnector: RobotConnector) {
    super();
    this.robotConnector = robotConnector;
  }

  public getChannelRequirements(robotConnector: RobotConnector): ChannelRequirement[] {
    return [
      {
        robotConnector: robotConnector,
        store: this,
      },
    ];
  }

  public abstract getStoreType(): StoreType;

  public getRobotConnector(): RobotConnector {
    return this.robotConnector;
  }
}
