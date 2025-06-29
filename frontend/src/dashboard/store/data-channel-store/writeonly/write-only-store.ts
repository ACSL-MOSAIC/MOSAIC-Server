import { DataStore } from "../../store"

export abstract class WriteOnlyStore<T, I = string> extends DataStore<T, I> {
    protected dataChannel: RTCDataChannel | null = null
    private channelRequired: boolean = true // 쓰기 전용은 항상 채널이 필요

    constructor(robotId: string, maxSize: number = 1000, parser: (data: I) => T | null) {
        super(robotId, maxSize, parser)
    }

    // 데이터 채널 설정
    public setDataChannel(channel: RTCDataChannel): void {
        this.dataChannel = channel
        console.log(`WriteOnlyStore[${this.robotId}] data channel set:`, channel.label, 'state:', channel.readyState)
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
            console.log(`WriteOnlyStore[${this.robotId}] data channel cleaned up`)
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

    // 쓰기 전용 Store는 항상 채널이 필요한지 확인
    public isChannelRequired(): boolean {
        return this.channelRequired
    }

    // 추상 메서드: 데이터 전송
    protected abstract sendData(data: any): void

    // 데이터 전송 (연결 상태 확인 후)
    protected sendDataIfConnected(data: any): boolean {
        if (this.isChannelConnected()) {
            this.sendData(data)
            return true
        } else {
            console.warn(`WriteOnlyStore[${this.robotId}] data channel is not connected. send failed. state:`, this.dataChannel?.readyState)
            return false
        }
    }

    // 강제 데이터 전송 (연결 상태 무시)
    protected sendDataForce(data: any): void {
        if (this.dataChannel) {
            try {
                this.dataChannel.send(data)
                console.log(`WriteOnlyStore[${this.robotId}] force data send: ${data}`)
            } catch (error) {
                console.error(`WriteOnlyStore[${this.robotId}] data send failed:`, error)
            }
        } else {
            console.error(`WriteOnlyStore[${this.robotId}] data channel is not found. send failed`)
        }
    }
} 