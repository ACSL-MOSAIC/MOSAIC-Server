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
    // 해당 robotId의 channelRequirements 배열에서 인자로 들어온 channelRequirement 제거
    const next = list.filter((req) => req !== channelRequirement)
    // 제거 후 배열이 비어있으면 robotId에 해당하는 channelRequirements 맵에서 삭제
    if (next.length === 0) {
      this.channelRequirements.delete(robotId)
    } else {
      // 아닐 시 다시 set으로 저장
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
