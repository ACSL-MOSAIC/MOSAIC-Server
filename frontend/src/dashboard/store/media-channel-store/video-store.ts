export interface VideoSubscriber {
  (videoData: VideoData): void;
}

export interface VideoData {
  streamId: string;
  robotId: string;
  channelLabel: string;
  mediaStream: MediaStream;
  isActive: boolean;
  stats: StreamStats;
  timestamp: number;
  metadata?: { mediaType?: string; description?: string; quality?: string; source?: string; trackIndex?: number };
}

export interface StreamStats {
  fps: number;
  width: number;
  height: number;
  resolution?: string;
  streamId?: string;
}

export interface StreamConfig {
  maxFrames?: number;
  captureInterval?: number; // ms
  quality?: number; // 0.1 ~ 1.0
}

export class VideoStore {
  protected robotId: string;
  protected channelLabel: string;
  protected mediaStream: MediaStream | null = null;
  protected videoElement: HTMLVideoElement | null = null;
  protected subscribers: Set<VideoSubscriber> = new Set();
  protected isActive: boolean = false;
  protected streamStats: StreamStats = {
    fps: 0,
    width: 0,
    height: 0
  };
  protected fpsCounter: number = 0;
  protected fpsInterval: number | null = null;
  protected streamConfig: StreamConfig = {};
  protected metadata: { mediaType?: string; description?: string; quality?: string; source?: string; trackIndex?: number } = {};

  constructor(robotId: string, channelLabel: string) {
    this.robotId = robotId;
    this.channelLabel = channelLabel;
  }

  // stream config setter
  setStreamConfig(config: StreamConfig): void {
    this.streamConfig = { ...this.streamConfig, ...config };
  }

  // stream config getter
  getStreamConfig(): StreamConfig {
    return this.streamConfig;
  }

  // metadata setter
  setMetadata(metadata: { mediaType?: string; description?: string; quality?: string; source?: string; trackIndex?: number }): void {
    this.metadata = { ...this.metadata, ...metadata };
    console.log(`VideoStore[${this.getChannelLabel()}] 메타데이터 설정:`, this.metadata);
  }

  // metadata getter
  getMetadata(): { mediaType?: string; description?: string; quality?: string; source?: string; trackIndex?: number } {
    return this.metadata;
  }

  // 구독자 관리
  subscribe(callback: VideoSubscriber): () => void {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  // MediaStream 설정
  setMediaStream(stream: MediaStream): void {
    this.mediaStream = stream;
    this.isActive = stream.active;
    
    // 비디오 엘리먼트에 스트림 연결
    if (this.videoElement) {
      this.videoElement.srcObject = stream;
      this.startFpsMonitoring();
    }
    
    // 구독자들에게 즉시 알림
    this.notifySubscribers();
  }

  // 비디오 엘리먼트 설정
  setVideoElement(videoElement: HTMLVideoElement): void {
    this.videoElement = videoElement;
    
    if (this.mediaStream) {
      this.videoElement.srcObject = this.mediaStream;
      this.startFpsMonitoring();
    }
  }

  // MediaStream 가져오기
  getMediaStream(): MediaStream | null {
    return this.mediaStream;
  }

  // 스트림 통계 가져오기
  getStreamStats(): StreamStats {
    return this.streamStats;
  }

  // 채널 라벨 가져오기
  getChannelLabel(): string {
    return this.channelLabel;
  }

  // 활성 상태 가져오기
  isStreamActive(): boolean {
    return this.isActive;
  }

  // FPS 모니터링 시작
  protected startFpsMonitoring(): void {
    if (this.fpsInterval) {
      clearInterval(this.fpsInterval);
    }

    this.fpsCounter = 0;
    this.fpsInterval = window.setInterval(() => {
      this.updateFps();
    }, 1000);
  }

  // FPS 모니터링 중지
  protected stopFpsMonitoring(): void {
    if (this.fpsInterval) {
      clearInterval(this.fpsInterval);
      this.fpsInterval = null;
    }
  }

  // FPS 업데이트 (자식 클래스에서 오버라이드 가능)
  protected updateFps(): void {
    if (!this.videoElement || !this.mediaStream) return;

    const fps = this.fpsCounter;
    this.fpsCounter = 0;
    
    // 스트림 통계 업데이트
    this.streamStats = {
      ...this.streamStats,
      fps: fps,
      width: this.videoElement.videoWidth || 640,
      height: this.videoElement.videoHeight || 480
    };
    
    // 구독자들에게 알림
    this.notifySubscribers();
  }

  // 구독자들에게 알림
  protected notifySubscribers(): void {
    if (!this.mediaStream) {
      return;
    }

    const videoData: VideoData = {
      streamId: this.mediaStream.id,
      robotId: this.robotId,
      channelLabel: this.channelLabel,
      mediaStream: this.mediaStream,
      isActive: this.isActive,
      stats: this.streamStats,
      timestamp: Date.now(),
      metadata: this.metadata
    };
    
    this.subscribers.forEach((callback) => {
      try {
        callback(videoData);
      } catch (error) {
        console.error(`VideoStore[${this.channelLabel}] 구독자 콜백 실행 중 오류:`, error);
      }
    });
  }

  // 정리
  destroy(): void {
    this.stopFpsMonitoring();
    
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    
    if (this.videoElement) {
      this.videoElement.srcObject = null;
      this.videoElement = null;
    }
    
    this.isActive = false;
  }

  // TurtlesimVideoStore에서 접근할 수 있도록 protected 멤버들을 public으로 노출
  public getRobotId(): string {
    return this.robotId;
  }

  public getVideoElement(): HTMLVideoElement | null {
    return this.videoElement;
  }

  public getSubscribers(): Set<VideoSubscriber> {
    return this.subscribers;
  }

  public getIsActive(): boolean {
    return this.isActive;
  }

  public getStreamStatsInternal(): StreamStats {
    return this.streamStats;
  }

  public getFpsCounter(): number {
    return this.fpsCounter;
  }

  public setFpsCounter(value: number): void {
    this.fpsCounter = value;
  }

  public setStreamStats(stats: StreamStats): void {
    this.streamStats = stats;
  }

  // FPS 카운터 증가 (비디오 프레임이 렌더링될 때 호출)
  public incrementFpsCounter(): void {
    this.fpsCounter++;
  }
} 