import { VideoStore } from "./video.store"
import { TurtlesimVideoStore } from "./turtlesim-video.store"

export class VideoStoreManager {
  private static instance: VideoStoreManager
  // robotId -> channelLabel -> store
  private videoStores: Map<string, Map<string, VideoStore>> = new Map()

  private constructor() {}

  public static getInstance(): VideoStoreManager {
    if (!VideoStoreManager.instance) {
      VideoStoreManager.instance = new VideoStoreManager()
    }
    return VideoStoreManager.instance
  }

  // 로봇의 비디오 스토어 컨테이너 초기화
  public initializeRobotVideoStores(robotId: string): void {
    const robotVideoStores = new Map<string, VideoStore>()
    this.videoStores.set(robotId, robotVideoStores)
    console.log(`로봇 ${robotId} 비디오 스토어 컨테이너 초기화`)
  }

  // 로봇의 모든 비디오 스토어 정리
  public cleanupRobotVideoStores(robotId: string): void {
    const robotVideoStores = this.videoStores.get(robotId)
    if (robotVideoStores) {
      // 모든 비디오 스토어 정리
      robotVideoStores.forEach(store => store.cleanup())
      this.videoStores.delete(robotId)
      console.log(`로봇 ${robotId} 비디오 스토어 컨테이너 정리 완료`)
    }
  }

  // 특정 채널의 비디오 스토어 생성 또는 가져오기
  public createVideoStoreIfNotExists(
    robotId: string, 
    channelLabel: string,
    dataType?: string
  ): VideoStore {
    let robotVideoStores = this.videoStores.get(robotId)
    
    if (!robotVideoStores) {
      robotVideoStores = new Map<string, VideoStore>()
      this.videoStores.set(robotId, robotVideoStores)
      console.log(`로봇 ${robotId} 비디오 스토어 컨테이너 동적 생성`)
    }
    
    let store = robotVideoStores.get(channelLabel)
    
    if (!store) {
      // 데이터 타입에 따라 적절한 스토어 타입 생성
      if (dataType === 'turtlesim_video') {
        store = new TurtlesimVideoStore(robotId)
        console.log(`TurtlesimVideoStore 생성됨: ${channelLabel} for robot ${robotId}`)
      } else {
        store = new VideoStore(robotId, channelLabel)
        console.log(`일반 VideoStore 생성됨: ${channelLabel} for robot ${robotId}`)
      }
      
      robotVideoStores.set(channelLabel, store)
    }
    
    return store
  }

  // 특정 채널의 비디오 스토어 가져오기
  public getVideoStore(robotId: string, channelLabel: string): VideoStore | undefined {
    return this.videoStores.get(robotId)?.get(channelLabel)
  }

  // 로봇의 모든 비디오 스토어 가져오기
  public getRobotVideoStores(robotId: string): Map<string, VideoStore> {
    return this.videoStores.get(robotId) || new Map()
  }

  // 로봇의 모든 비디오 채널 라벨 가져오기
  public getRobotVideoChannels(robotId: string): string[] {
    const robotVideoStores = this.videoStores.get(robotId)
    return robotVideoStores ? Array.from(robotVideoStores.keys()) : []
  }

  // 특정 채널의 비디오 스토어 제거
  public removeVideoStore(robotId: string, channelLabel: string): void {
    const robotVideoStores = this.videoStores.get(robotId)
    if (robotVideoStores) {
      const store = robotVideoStores.get(channelLabel)
      if (store) {
        store.cleanup()
        robotVideoStores.delete(channelLabel)
        console.log(`비디오 스토어 제거됨: ${channelLabel} for robot ${robotId}`)
      }
    }
  }
} 