import { DataStore } from "../../store"

export abstract class ReadOnlyStore<T, I = string> extends DataStore<T, I> {
    protected dataChannel: RTCDataChannel | null = null

    constructor(robotId: string, maxSize: number = 1000, parser: (data: I) => T | null) {
        super(robotId, maxSize, parser)
    }

    // 데이터 채널 설정
    public setDataChannel(channel: RTCDataChannel): void {
        this.dataChannel = channel
        console.log(`ReadOnlyStore[${this.robotId}]에 데이터 채널 설정됨:`, channel.label)
    }

    // 데이터 채널 가져오기
    public getDataChannel(): RTCDataChannel | null {
        return this.dataChannel
    }

    // 데이터 채널 연결 상태 확인
    public isChannelConnected(): boolean {
        return this.dataChannel?.readyState === 'open'
    }

    // 데이터 채널 정리
    public cleanupDataChannel(): void {
        if (this.dataChannel) {
            this.dataChannel = null
            console.log(`ReadOnlyStore[${this.robotId}] 데이터 채널 정리됨`)
        }
    }

    // 데이터 채널 상태 정보 반환
    public getChannelInfo(): { connected: boolean; label?: string; state?: string } {
        return {
            connected: this.isChannelConnected(),
            label: this.dataChannel?.label,
            state: this.dataChannel?.readyState
        }
    }
} 