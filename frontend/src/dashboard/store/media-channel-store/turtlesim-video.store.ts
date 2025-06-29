import { VideoStore, VideoData } from "./video-store"

export interface TurtlesimVideoData extends VideoData {
    // Turtlesim 특화 데이터
    simulationTime: number
    turtlePosition: { x: number; y: number } | null
}

export class TurtlesimVideoStore extends VideoStore {
    private simulationTime: number = 0
    private turtlePosition: { x: number; y: number } | null = null

    constructor(robotId: string, channelLabel: string) {
        super(robotId, channelLabel)
        
        console.log(`TurtlesimVideoStore 생성됨: ${channelLabel} for robot ${robotId}`)
    }

    // 터틀심 특화 메서드들
    public setSimulationTime(time: number): void {
        this.simulationTime = time
        console.log(`TurtlesimVideoStore[${this.getChannelLabel()}] 시뮬레이션 시간 설정:`, time)
    }

    public getSimulationTime(): number {
        return this.simulationTime
    }

    public setTurtlePosition(x: number, y: number): void {
        this.turtlePosition = { x, y }
        console.log(`TurtlesimVideoStore[${this.getChannelLabel()}] 터틀 위치 설정:`, { x, y })
    }

    public getTurtlePosition(): { x: number; y: number } | null {
        return this.turtlePosition
    }

    // FPS 업데이트 오버라이드 (터틀심 특화 데이터 포함)
    protected updateFps(): void {
        const videoElement = this.getVideoElement()
        const mediaStream = this.getMediaStream()
        
        if (!videoElement || !mediaStream) return

        const fps = this.getFpsCounter()
        this.setFpsCounter(0)
        
        // 스트림 통계 업데이트
        const currentStats = this.getStreamStatsInternal()
        const newStats = {
            ...currentStats,
            fps: fps,
            width: videoElement.videoWidth || 640,
            height: videoElement.videoHeight || 480
        }
        this.setStreamStats(newStats)
        
        console.log(`TurtlesimVideoStore[${this.getChannelLabel()}] FPS 업데이트:`, newStats)
        
        // 터틀심 특화 데이터를 포함한 비디오 데이터 생성
        const turtlesimVideoData: TurtlesimVideoData = {
            streamId: mediaStream.id,
            robotId: this.getRobotId(),
            channelLabel: this.getChannelLabel(),
            mediaStream: mediaStream,
            isActive: this.getIsActive(),
            stats: newStats,
            timestamp: Date.now(),
            simulationTime: this.simulationTime,
            turtlePosition: this.turtlePosition
        }
        
        console.log(`TurtlesimVideoStore[${this.getChannelLabel()}] 터틀심 비디오 데이터:`, turtlesimVideoData)
        
        // 구독자들에게 터틀심 특화 데이터 전달
        this.notifyTurtlesimSubscribers(turtlesimVideoData)
    }

    // 터틀심 특화 구독자 알림
    private notifyTurtlesimSubscribers(videoData: TurtlesimVideoData): void {
        const subscribers = this.getSubscribers()
        console.log(`TurtlesimVideoStore[${this.getChannelLabel()}] 터틀심 구독자들에게 알림 (${subscribers.size}명):`, videoData)
        subscribers.forEach((callback: any) => {
            try {
                callback(videoData)
            } catch (error) {
                console.error(`TurtlesimVideoStore[${this.getChannelLabel()}] 구독자 콜백 실행 중 오류:`, error)
            }
        })
    }

    // 터틀심 특화 정리 메서드
    public destroy(): void {
        console.log(`TurtlesimVideoStore[${this.getChannelLabel()}] 터틀심 정리 시작`)
        this.simulationTime = 0
        this.turtlePosition = null
        super.destroy()
        console.log(`TurtlesimVideoStore[${this.getChannelLabel()}] 터틀심 정리 완료`)
    }
} 