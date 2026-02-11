import type {ChannelInfo, ChannelRequirement} from "@/mosaic/channel/index.ts"
import type {RobotConnector} from "@/mosaic"

export class ChannelManager {
  private activeChannels: Map<string, ChannelInfo> = new Map()
  private channelRequirements: Map<string, ChannelRequirement[]> = new Map()

  public registerActiveChannel(channelInfo: ChannelInfo): void {
    this.activeChannels.set(
      channelInfo.robotConnector.serialize(),
      channelInfo,
    )
  }

  public addChannelRequirement(channelRequirement: ChannelRequirement): void {
    const robotId = channelRequirement.robotConnector.robotId
    const list = this.channelRequirements.get(robotId) ?? []
    list.push(channelRequirement)
    this.channelRequirements.set(robotId, list)
  }

  public removeChannelRequirement(channelRequirement: ChannelRequirement): void {
    const robotId = channelRequirement.robotConnector.robotId
    const list = this.channelRequirements.get(robotId)
    if (list === undefined) return
    // Remove the given channelRequirement from the array for this robotId
    const next = list.filter((req) => req !== channelRequirement)
    // If the array is empty after removal, delete the robotId entry from the map
    if (next.length === 0) {
      this.channelRequirements.delete(robotId)
    } else {
      // Otherwise save the updated array back
      this.channelRequirements.set(robotId, next)
    }
  }

  public getActiveChannel(
    robotConnector: RobotConnector,
  ): ChannelInfo | undefined {
    return this.activeChannels.get(robotConnector.serialize())
  }

  public getAllActiveChannels(robotId: string): ChannelInfo[] {
    return Array.from(this.activeChannels.values()).filter(
      (info) => info.robotConnector.robotId === robotId,
    )
  }
}
