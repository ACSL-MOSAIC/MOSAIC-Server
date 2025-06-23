import { VideoStore } from "./video.store"
import { ParsedTurtlesimVideo, parseTurtlesimVideo } from "../parser/turtlesim-video"

export class TurtlesimVideoStore extends VideoStore {
    private simulationTime: number = 0
    private turtlePosition: { x: number; y: number } | null = null

    constructor(robotId: string, maxSize: number = 5) {
        super(robotId, 'turtlesim_video', maxSize)
        this.setParser(parseTurtlesimVideo)
    }

    private setParser(parser: (data: string) => ParsedTurtlesimVideo | null): void {
        (this as any).parser = parser
    }

    // 터틀심 특화 메서드들
    public setSimulationTime(time: number): void {
        this.simulationTime = time
    }

    public getSimulationTime(): number {
        return this.simulationTime
    }

    public setTurtlePosition(x: number, y: number): void {
        this.turtlePosition = { x, y }
    }

    public getTurtlePosition(): { x: number; y: number } | null {
        return this.turtlePosition
    }

    // FPS 업데이트 오버라이드 (터틀심 특화 데이터 포함)
    public updateFps(): void {
        if (!this.getVideoElement() || !this.getMediaStream()) return

        const fps = this.fpsCounter
        this.fpsCounter = 0
        
        const mediaStream = this.getMediaStream()
        const videoElement = this.getVideoElement()
        
        // 터틀심 특화 정보를 포함한 FPS 정보를 스토어에 추가
        const videoData = {
            streamId: mediaStream?.id || 'unknown',
            robotId: this.robotId,
            channelLabel: this.getChannelLabel(),
            fps: fps,
            width: videoElement?.videoWidth || 640,
            height: videoElement?.videoHeight || 480,
            isActive: mediaStream?.active || false,
            simulationTime: this.simulationTime,
            turtlePosition: this.turtlePosition
        }
        
        console.log(`TurtlesimVideoStore[${this.getChannelLabel()}] FPS 데이터 추가:`, videoData)
        console.log(`TurtlesimVideoStore[${this.getChannelLabel()}] MediaStream 상태:`, {
            hasMediaStream: !!mediaStream,
            mediaStreamId: mediaStream?.id,
            mediaStreamActive: mediaStream?.active,
            hasVideoElement: !!videoElement,
            videoWidth: videoElement?.videoWidth,
            videoHeight: videoElement?.videoHeight
        })
        
        // 파서가 기대하는 구조로 데이터 전달
        const jsonData = JSON.stringify(videoData)
        console.log(`TurtlesimVideoStore[${this.getChannelLabel()}] JSON 데이터:`, jsonData)
        this.add(jsonData)
    }

    // 터틀심 특화 정리 메서드
    public cleanup(): void {
        this.simulationTime = 0
        this.turtlePosition = null
        super.cleanup()
        console.log('TurtlesimVideoStore 정리 완료')
    }
} 