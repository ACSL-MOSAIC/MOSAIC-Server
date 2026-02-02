import type {ChannelInfo, ChannelRequirement} from "@/mosaic/channel/index.ts"
import type {RobotConnector} from "@/mosaic"

export class ChannelManager {
  private activeChannels: Map<string, ChannelInfo>
  private channelRequirements: Map<string, ChannelRequirement[]>

  public registerActiveChannel(channelInfo: ChannelInfo): void

  public addChannelRequirement(channelRequirement: ChannelRequirement): void

  public removeChannelRequirement(channelRequirement: ChannelRequirement): void

  public getActiveChannel(
    robotConnector: RobotConnector,
  ): ChannelInfo | undefined

  public getAllActiveChannels(robotId: string): ChannelInfo[]
}
