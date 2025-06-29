// Video Store - 실시간 스트림 전달자 역할
// Data Store와는 달리 프레임을 저장하지 않고 즉시 구독자에게 전달

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

  constructor(robotId: string, channelLabel: string) {
    this.robotId = robotId;
    this.channelLabel = channelLabel;
    console.log(`VideoStore 생성됨: ${channelLabel} for robot ${robotId}`);
  }

  // 스트림 설정
  setStreamConfig(config: StreamConfig): void {
    this.streamConfig = { ...this.streamConfig, ...config };
    console.log(`VideoStore[${this.channelLabel}] 스트림 설정 업데이트:`, this.streamConfig);
  }

  // 스트림 설정 가져오기
  getStreamConfig(): StreamConfig {
    return this.streamConfig;
  }

  // 메타데이터 설정 (SDP에서 파싱된 정보)
  setMetadata(metadata: { mediaType?: string; description?: string; quality?: string; source?: string; trackIndex?: number }): void {
    // 품질 문자열 파싱
    const qualityConfig = this.parseQualityString(metadata.quality || '640x480@30fps');
    
    // 스트림 설정 업데이트
    this.setStreamConfig({
      // 기본 설정 유지
    });
    
    console.log(`VideoStore[${this.channelLabel}] 메타데이터 설정:`, metadata);
  }

  // 품질 문자열 파싱 (내부 메서드)
  private parseQualityString(qualityStr: string): { width: number; height: number; framerate: number; bitrate: number } | undefined {
    try {
      // "640x480@30fps" 형식 파싱
      const match = qualityStr.match(/(\d+)x(\d+)@(\d+)fps/);
      if (match) {
        return {
          width: parseInt(match[1]),
          height: parseInt(match[2]),
          framerate: parseInt(match[3]),
          bitrate: 1000000 // 기본 비트레이트 1Mbps
        };
      }
    } catch (error) {
      console.warn('품질 문자열 파싱 실패:', qualityStr);
    }
    return undefined;
  }

  // 구독자 관리
  subscribe(callback: VideoSubscriber): () => void {
    this.subscribers.add(callback);
    console.log(`VideoStore[${this.channelLabel}] 구독자 추가됨, 총 ${this.subscribers.size}명`);
    return () => {
      this.subscribers.delete(callback);
      console.log(`VideoStore[${this.channelLabel}] 구독자 제거됨, 총 ${this.subscribers.size}명`);
    };
  }

  // MediaStream 설정
  setMediaStream(stream: MediaStream): void {
    console.log(`🎬 VideoStore[${this.channelLabel}] setMediaStream 호출됨:`, {
      streamId: stream.id,
      streamActive: stream.active,
      tracksCount: stream.getTracks().length,
      tracks: stream.getTracks().map(track => ({
        kind: track.kind,
        id: track.id,
        label: track.label,
        enabled: track.enabled,
        readyState: track.readyState
      }))
    });
    
    this.mediaStream = stream;
    this.isActive = stream.active;
    
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
    });
    
    // 비디오 엘리먼트에 스트림 연결
    if (this.videoElement) {
      console.log(`VideoStore[${this.channelLabel}] 비디오 엘리먼트에 스트림 연결:`, this.videoElement);
      this.videoElement.srcObject = stream;
      this.startFpsMonitoring();
    } else {
      console.log(`VideoStore[${this.channelLabel}] 비디오 엘리먼트가 아직 설정되지 않음, 나중에 연결됨`);
    }
    
    // 구독자들에게 즉시 알림
    this.notifySubscribers();
  }

  // 비디오 엘리먼트 설정
  setVideoElement(videoElement: HTMLVideoElement): void {
    console.log(`🎬 VideoStore[${this.channelLabel}] setVideoElement 호출됨:`, {
      videoElement: videoElement,
      hasMediaStream: !!this.mediaStream,
      mediaStreamId: this.mediaStream?.id
    });
    
    this.videoElement = videoElement;
    console.log(`VideoStore[${this.channelLabel}] 비디오 엘리먼트 설정:`, videoElement);
    
    if (this.mediaStream) {
      console.log(`VideoStore[${this.channelLabel}] 기존 MediaStream 연결:`, this.mediaStream);
      this.videoElement.srcObject = this.mediaStream;
      this.startFpsMonitoring();
    } else {
      console.log(`VideoStore[${this.channelLabel}] MediaStream이 아직 없음, 나중에 연결됨`);
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

    console.log(`VideoStore[${this.channelLabel}] FPS 모니터링 시작`);
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
      console.log(`VideoStore[${this.channelLabel}] FPS 모니터링 중지`);
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
    
    console.log(`VideoStore[${this.channelLabel}] FPS 업데이트:`, this.streamStats);
    
    // 구독자들에게 알림
    this.notifySubscribers();
  }

  // 구독자들에게 알림
  protected notifySubscribers(): void {
    if (!this.mediaStream) {
      console.log(`🎬 VideoStore[${this.channelLabel}] notifySubscribers: MediaStream 없음`);
      return;
    }

    const videoData: VideoData = {
      streamId: this.mediaStream.id,
      robotId: this.robotId,
      channelLabel: this.channelLabel,
      mediaStream: this.mediaStream,
      isActive: this.isActive,
      stats: this.streamStats,
      timestamp: Date.now()
    };
    
    console.log(`🎬 VideoStore[${this.channelLabel}] 구독자들에게 알림:`, {
      subscribersCount: this.subscribers.size,
      videoData: {
        streamId: videoData.streamId,
        robotId: videoData.robotId,
        channelLabel: videoData.channelLabel,
        isActive: videoData.isActive,
        stats: videoData.stats
      }
    });
    
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
    console.log(`VideoStore[${this.channelLabel}] 정리 시작`);
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
    console.log(`VideoStore[${this.channelLabel}] 정리 완료`);
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
} 