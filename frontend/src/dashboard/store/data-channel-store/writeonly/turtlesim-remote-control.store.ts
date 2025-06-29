import { WriteOnlyStore } from "./write-only-store"
import { ParsedTurtlesimRemoteControl, parseTurtlesimRemoteControl } from "../../../parser/turtlesim-remote-control"

export class TurtlesimRemoteControlStore extends WriteOnlyStore<ParsedTurtlesimRemoteControl> {
    constructor(robotId: string, maxSize: number = 100) {
        super(robotId, maxSize, parseTurtlesimRemoteControl)
    }

    // 원격 제어 명령 전송 메서드
    public sendCommand(direction: 'up' | 'down' | 'left' | 'right'): boolean {
        const command = {
            direction: direction,
            timestamp: Date.now()
        }
        
        // 스토어에 추가 (내부 처리용)
        this.add(JSON.stringify(command))
        
        // WebRTC 채널로 실제 전송
        return this.sendDataIfConnected(JSON.stringify(command))
    }

    // 추상 메서드 구현: 데이터 전송
    protected sendData(data: any): void {
        if (this.dataChannel && this.dataChannel.readyState === 'open') {
            this.dataChannel.send(data)
            console.log(`원격 제어 명령 전송: ${data} -> ${this.dataChannel.label}`)
        }
    }
} 