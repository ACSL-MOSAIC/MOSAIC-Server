import { DataStore } from "../../store"

export abstract class WriteOnlyStore<T, I = string> extends DataStore<T, I> {
    protected dataChannel: RTCDataChannel | null = null
    private channelRequired: boolean = true // 쓰기 전용은 항상 채널이 필요
    private connectionStateListeners: ((connected: boolean) => void)[] = []

    constructor(robotId: string, maxSize: number = 1000, parser: (data: I) => T | null) {
        super(robotId, maxSize, parser)
    }

    // 데이터 채널 설정
    public setDataChannel(channel: RTCDataChannel): void {
        this.dataChannel = channel
        console.log(`WriteOnlyStore[${this.robotId}] data channel set:`, channel.label, 'state:', channel.readyState)
        
        // DataChannel 상태 변경 이벤트 리스너 설정
        this.setupDataChannelEventListeners(channel)
    }

    // DataChannel 이벤트 리스너 설정
    private setupDataChannelEventListeners(channel: RTCDataChannel): void {
        channel.onopen = () => {
            console.log(`WriteOnlyStore[${this.robotId}] data channel opened:`, channel.label, 'state:', channel.readyState)
            this.notifyConnectionStateChange(true)
        }

        channel.onclose = () => {
            console.log(`WriteOnlyStore[${this.robotId}] data channel closed:`, channel.label, 'state:', channel.readyState)
            this.notifyConnectionStateChange(false)
        }

        channel.onerror = (error) => {
            console.error(`WriteOnlyStore[${this.robotId}] data channel error:`, channel.label, error)
            this.notifyConnectionStateChange(false)
        }

        // 초기 상태가 이미 open이면 즉시 알림
        if (channel.readyState === 'open') {
            this.notifyConnectionStateChange(true)
        }
    }

    // 연결 상태 변경 알림
    private notifyConnectionStateChange(connected: boolean): void {
        this.connectionStateListeners.forEach(listener => {
            try {
                listener(connected)
            } catch (error) {
                console.error('connection state listener error:', error)
            }
        })
    }

    // 연결 상태 변경 리스너 등록
    public onConnectionStateChange(listener: (connected: boolean) => void): () => void {
        this.connectionStateListeners.push(listener)
        
        // 현재 상태 즉시 알림
        if (this.dataChannel) {
            listener(this.isChannelConnected())
        }
        
        // 리스너 제거 함수 반환
        return () => {
            this.connectionStateListeners = this.connectionStateListeners.filter(l => l !== listener)
        }
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
            // 이벤트 리스너 제거
            this.dataChannel.onopen = null
            this.dataChannel.onclose = null
            this.dataChannel.onerror = null
            
            this.dataChannel = null
            this.connectionStateListeners = []
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