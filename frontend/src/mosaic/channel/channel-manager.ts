import type { RobotConnector } from "@/mosaic";
import type { ChannelInfo, ChannelRequirement } from "@/mosaic/channel/index.ts";

export class ChannelManager {
  private activeChannels: Map<string, ChannelInfo> = new Map();
  private channelRequirements: Map<string, ChannelRequirement[]> = new Map();

  public registerActiveChannel(channelInfo: ChannelInfo): void {
    this.activeChannels.set(channelInfo.robotConnector.serialize(), channelInfo);
  }

  public addChannelRequirement(channelRequirement: ChannelRequirement): void {
    const robotId = channelRequirement.robotConnector.robotId;
    const list = this.channelRequirements.get(robotId) ?? [];
    const existingIndex = list.findIndex(
      (cr) => cr.robotConnector.serialize() === channelRequirement.robotConnector.serialize(),
    );
    if (existingIndex >= 0) {
      // Keep only one requirement per connector and always keep the latest store ref.
      list[existingIndex] = channelRequirement;
      this.channelRequirements.set(robotId, list);
      return;
    }
    list.push(channelRequirement);
    this.channelRequirements.set(robotId, list);
  }

  public removeChannelRequirementByConnector(robotConnector: RobotConnector): void {
    const robotId = robotConnector.robotId;
    const list = this.channelRequirements.get(robotId);
    if (list === undefined) return;
    const targetSerialized = robotConnector.serialize();
    const next = list.filter((req) => req.robotConnector.serialize() !== targetSerialized);
    if (next.length === 0) {
      this.channelRequirements.delete(robotId);
    } else {
      this.channelRequirements.set(robotId, next);
    }
  }

  public removeChannelRequirement(channelRequirement: ChannelRequirement): void {
    this.removeChannelRequirementByConnector(channelRequirement.robotConnector);
  }

  public getActiveChannel(robotConnector: RobotConnector): ChannelInfo | undefined {
    return this.activeChannels.get(robotConnector.serialize());
  }

  public getAllActiveChannels(robotId: string): ChannelInfo[] {
    return Array.from(this.activeChannels.values()).filter(
      (info) => info.robotConnector.robotId === robotId,
    );
  }

  public getChannelRequirements(robotId: string): ChannelRequirement[] {
    const requirements = this.channelRequirements.get(robotId);
    if (!requirements) {
      return [];
    }
    return [...requirements];
  }
}
