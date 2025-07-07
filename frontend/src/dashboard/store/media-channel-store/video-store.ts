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
  metadata?: { mediaType?: string; source?: string };
}

export interface StreamStats {
  fps: number;
  width: number;
  height: number;
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
  protected metadata: { mediaType?: string; source?: string } = {};

  constructor(robotId: string, channelLabel: string) {
    this.robotId = robotId;
    this.channelLabel = channelLabel;
  }

  // Metadata setter (simplified metadata)
  setMetadata(metadata: { mediaType?: string; source?: string }): void {
    this.metadata = { ...this.metadata, ...metadata };
  }

  // Metadata getter (simplified metadata)
  getMetadata(): { mediaType?: string; source?: string } {
    return this.metadata;
  }

  // Subscriber management
  subscribe(callback: VideoSubscriber): () => void {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  // Set MediaStream
  setMediaStream(stream: MediaStream): void {
    this.mediaStream = stream;
    this.isActive = stream.active;
    
    // Connect stream to video element
    if (this.videoElement) {
      this.videoElement.srcObject = stream;
      this.startFpsMonitoring();
    }
    
    // Notify subscribers immediately
    this.notifySubscribers();
  }

  // Set video element
  setVideoElement(videoElement: HTMLVideoElement): void {
    this.videoElement = videoElement;
    
    if (this.mediaStream) {
      this.videoElement.srcObject = this.mediaStream;
      this.startFpsMonitoring();
    }
  }

  // Get MediaStream
  getMediaStream(): MediaStream | null {
    return this.mediaStream;
  }

  // Get stream statistics
  getStreamStats(): StreamStats {
    return this.streamStats;
  }

  // Get channel label
  getChannelLabel(): string {
    return this.channelLabel;
  }

  // Get active status
  isStreamActive(): boolean {
    return this.isActive;
  }

  // Start FPS monitoring
  protected startFpsMonitoring(): void {
    if (this.fpsInterval) {
      clearInterval(this.fpsInterval);
    }

    this.fpsCounter = 0;
    this.fpsInterval = window.setInterval(() => {
      this.updateFps();
    }, 1000);
  }

  // Stop FPS monitoring
  protected stopFpsMonitoring(): void {
    if (this.fpsInterval) {
      clearInterval(this.fpsInterval);
      this.fpsInterval = null;
    }
  }

  // Update FPS (can be overridden by child classes)
  protected updateFps(): void {
    if (!this.videoElement || !this.mediaStream) return;

    const fps = this.fpsCounter;
    this.fpsCounter = 0;
    
    // Update stream statistics
    this.streamStats = {
      ...this.streamStats,
      fps: fps,
      width: this.videoElement.videoWidth || 640,
      height: this.videoElement.videoHeight || 480
    };
    
    // Notify subscribers
    this.notifySubscribers();
  }

  // Notify subscribers
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
        console.error(`VideoStore[${this.channelLabel}] Subscriber callback error:`, error);
      }
    });
  }

  // Cleanup
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
    this.subscribers.clear();
  }

  // Internal access methods (used by child classes)
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

  public incrementFpsCounter(): void {
    this.fpsCounter++;
  }
} 