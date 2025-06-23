import { DataStore } from "./store"
import { ParsedVideoData, parseVideoData } from "../parser/video-data"

export class VideoStore extends DataStore<ParsedVideoData> {
    private mediaStream: MediaStream | null = null
    private videoElement: HTMLVideoElement | null = null
    protected fpsCounter: number = 0
    private fpsInterval: number | null = null
    private channelLabel: string

    constructor(robotId: string, channelLabel: string, maxSize: number = 5) {
        super(robotId, maxSize, parseVideoData)
        this.channelLabel = channelLabel
    }

    // 채널 라벨 가져오기
    public getChannelLabel(): string {
        return this.channelLabel
    }

    // MediaStream 설정
    public setMediaStream(stream: MediaStream): void {
        this.mediaStream = stream
        console.log(`VideoStore[${this.channelLabel}]에 MediaStream 설정됨:`, {
            streamId: stream.id,
            active: stream.active,
            tracks: stream.getTracks().map(track => ({
                kind: track.kind,
                label: track.label,
                id: track.id,
                enabled: track.enabled,
                readyState: track.readyState
            }))
        })
        
        // 비디오 엘리먼트에 스트림 연결
        if (this.videoElement) {
            console.log(`VideoStore[${this.channelLabel}] 비디오 엘리먼트에 스트림 연결:`, this.videoElement)
            this.videoElement.srcObject = stream
            this.startFpsMonitoring()
        } else {
            console.log(`VideoStore[${this.channelLabel}] 비디오 엘리먼트가 아직 설정되지 않음, 나중에 연결됨`)
        }
    }

    // 비디오 엘리먼트 설정
    public setVideoElement(videoElement: HTMLVideoElement): void {
        this.videoElement = videoElement
        console.log(`VideoStore[${this.channelLabel}] 비디오 엘리먼트 설정:`, videoElement)
        
        if (this.mediaStream) {
            console.log(`VideoStore[${this.channelLabel}] 기존 MediaStream 연결:`, this.mediaStream)
            this.videoElement.srcObject = this.mediaStream
            this.startFpsMonitoring()
        } else {
            console.log(`VideoStore[${this.channelLabel}] MediaStream이 아직 없음, 나중에 연결됨`)
        }
    }

    // FPS 모니터링 시작
    private startFpsMonitoring(): void {
        if (this.fpsInterval) {
            clearInterval(this.fpsInterval)
        }

        console.log(`VideoStore[${this.channelLabel}] FPS 모니터링 시작`)

        this.fpsInterval = window.setInterval(() => {
            this.updateFps()
        }, 1000) // 1초마다 FPS 업데이트
    }

    // FPS 업데이트 (자식 클래스에서 오버라이드 가능)
    protected updateFps(): void {
        if (!this.videoElement || !this.mediaStream) return

        const fps = this.fpsCounter
        this.fpsCounter = 0
        
        // FPS 정보를 스토어에 추가 (channelLabel 포함)
        const videoData = {
            streamId: this.mediaStream.id,
            robotId: this.robotId,
            channelLabel: this.channelLabel,
            fps: fps,
            width: this.videoElement.videoWidth || 640,
            height: this.videoElement.videoHeight || 480,
            isActive: this.mediaStream.active
        }
        
        console.log(`VideoStore[${this.channelLabel}] FPS 데이터 추가:`, videoData)
        console.log(`VideoStore[${this.channelLabel}] MediaStream 상태:`, {
            hasMediaStream: !!this.mediaStream,
            mediaStreamId: this.mediaStream?.id,
            mediaStreamActive: this.mediaStream?.active,
            hasVideoElement: !!this.videoElement,
            videoWidth: this.videoElement?.videoWidth,
            videoHeight: this.videoElement?.videoHeight
        })
        
        this.add(JSON.stringify(videoData))
    }

    // 프레임 카운터 증가 (비디오 엘리먼트에서 호출)
    public incrementFrameCount(): void {
        this.fpsCounter++
    }

    // MediaStream 가져오기
    public getMediaStream(): MediaStream | null {
        return this.mediaStream
    }

    // 비디오 엘리먼트 가져오기
    public getVideoElement(): HTMLVideoElement | null {
        return this.videoElement
    }

    // 스트림 정리
    public cleanup(): void {
        if (this.fpsInterval) {
            clearInterval(this.fpsInterval)
            this.fpsInterval = null
        }
        
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop())
            this.mediaStream = null
        }
        
        if (this.videoElement) {
            this.videoElement.srcObject = null
            this.videoElement = null
        }
        
        console.log(`VideoStore[${this.channelLabel}] 정리 완료`)
    }
} 