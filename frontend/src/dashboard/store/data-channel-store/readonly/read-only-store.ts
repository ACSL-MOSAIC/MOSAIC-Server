import {DataStore} from "../../store"

export abstract class ReadOnlyStore<T, I = string> extends DataStore<T, I> {
  // 다중 채널 지원
  protected dataChannels: Map<string, RTCDataChannel> = new Map()

  // 다중 채널 추가
  public addDataChannel(channel: RTCDataChannel): void {
    this.dataChannels.set(channel.label, channel)
    // console.log(
    //   `ReadOnlyStore[${this.robotId}] data channel added:`,
    //   channel.label,
    // )
  }

  // 채널 제거
  public removeDataChannel(channelLabel: string): void {
    this.dataChannels.delete(channelLabel)
    console.log(
      `ReadOnlyStore[${this.robotId}] data channel removed:`,
      channelLabel,
    )
  }

  // 특정 채널 가져오기
  public getDataChannel(channelLabel: string): RTCDataChannel | null {
    return this.dataChannels.get(channelLabel) || null
  }

  // 모든 채널 가져오기
  public getAllDataChannels(): Map<string, RTCDataChannel> {
    return this.dataChannels
  }

  // 연결된 채널 확인
  public isChannelConnected(channelLabel?: string): boolean {
    if (channelLabel) {
      const channel = this.dataChannels.get(channelLabel)
      return channel?.readyState === "open"
    }

    // 모든 채널이 연결되어 있는지 확인
    return Array.from(this.dataChannels.values()).every(
      (channel) => channel.readyState === "open",
    )
  }

  // 연결된 채널이 하나라도 있는지 확인
  public hasAnyConnectedChannel(): boolean {
    return Array.from(this.dataChannels.values()).some(
      (channel) => channel.readyState === "open",
    )
  }

  // Clean up data channels
  public cleanupDataChannel(): void {
    this.dataChannels.clear()
    // console.log(`ReadOnlyStore[${this.robotId}] all data channels cleaned up`)
  }

  // Get data channel state information
  public getChannelInfo(): {
    connected: boolean
    label?: string
    state?: string
  } {
    const connectedChannels = Array.from(this.dataChannels.values()).filter(
      (channel) => channel.readyState === "open",
    )

    return {
      connected: connectedChannels.length > 0,
      label:
        connectedChannels.length > 0 ? connectedChannels[0].label : undefined,
      state:
        connectedChannels.length > 0
          ? connectedChannels[0].readyState
          : "closed",
    }
  }

  // 모든 채널 정보 가져오기
  public getAllChannelInfo(): Array<{
    label: string
    connected: boolean
    state: string
  }> {
    return Array.from(this.dataChannels.entries()).map(([label, channel]) => ({
      label,
      connected: channel.readyState === "open",
      state: channel.readyState,
    }))
  }
}
