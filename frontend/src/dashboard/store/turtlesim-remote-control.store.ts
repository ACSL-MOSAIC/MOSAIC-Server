import { DataStore } from "./store"
import { ParsedTurtlesimRemoteControl, parseTurtlesimRemoteControl } from "../parser/turtlesim-remote-control"

export class TurtlesimRemoteControlStore extends DataStore<ParsedTurtlesimRemoteControl> {
    private dataChannel: RTCDataChannel | null = null;

    constructor(robotId: string, maxSize: number = 100) {
        super(robotId, maxSize, parseTurtlesimRemoteControl)
    }

    // WebRTC 데이터 채널 설정
    public setDataChannel(channel: RTCDataChannel): void {
        this.dataChannel = channel;
        console.log('TurtlesimRemoteControlStore에 데이터 채널 설정됨:', channel.label);
    }

    // WebRTC 데이터 채널 가져오기
    public getDataChannel(): RTCDataChannel | null {
        return this.dataChannel;
    }

    // 원격 제어 명령 전송 메서드
    public sendCommand(direction: 'up' | 'down' | 'left' | 'right'): void {
        const command = {
            direction: direction,
            timestamp: Date.now()
        }
        
        // 스토어에 추가 (내부 처리용)
        this.add(JSON.stringify(command))
        
        // WebRTC 채널로 실제 전송
        if (this.dataChannel && this.dataChannel.readyState === 'open') {
            this.dataChannel.send(JSON.stringify(command));
            console.log(`원격 제어 명령 전송: ${direction} -> ${this.dataChannel.label}`);
        } else {
            console.warn('데이터 채널이 연결되지 않았습니다. 명령 전송 실패:', direction);
        }
    }

    // 데이터 채널 상태 확인
    public isChannelConnected(): boolean {
        return this.dataChannel?.readyState === 'open';
    }
} 