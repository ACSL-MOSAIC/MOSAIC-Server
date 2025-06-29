import { VideoStore, VideoData } from "./video-store"

export class TurtlesimVideoStore extends VideoStore {
    constructor(robotId: string, channelLabel: string) {
        super(robotId, channelLabel)
    }

    // FPS Update Override
    protected updateFps(): void {
        const videoElement = this.getVideoElement()
        const mediaStream = this.getMediaStream()
        
        if (!videoElement || !mediaStream) return

        const fps = this.getFpsCounter()
        this.setFpsCounter(0)
        
        // Update stream statistics
        const currentStats = this.getStreamStatsInternal()
        const newStats = {
            ...currentStats,
            fps: fps,
            width: videoElement.videoWidth || 640,
            height: videoElement.videoHeight || 480
        }
        this.setStreamStats(newStats)
        
        // Create video data
        const videoData: VideoData = {
            streamId: mediaStream.id,
            robotId: this.getRobotId(),
            channelLabel: this.getChannelLabel(),
            mediaStream: mediaStream,
            isActive: this.getIsActive(),
            stats: newStats,
            timestamp: Date.now(),
            metadata: this.getMetadata()
        }
        
        // Notify subscribers
        this.notifyTurtlesimSubscribers(videoData)
    }

    // Notify subscribers
    private notifyTurtlesimSubscribers(videoData: VideoData): void {
        const subscribers = this.getSubscribers()
        subscribers.forEach((callback: any) => {
            try {
                callback(videoData)
            } catch (error) {
                console.error(`TurtlesimVideoStore[${this.getChannelLabel()}] Error in subscriber callback:`, error)
            }
        })
    }

    // Cleanup method
    public destroy(): void {
        super.destroy()
    }
} 