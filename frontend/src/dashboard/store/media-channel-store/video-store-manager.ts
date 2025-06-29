import { VideoStore } from "./video-store"
import { TurtlesimVideoStore } from "./turtlesim-video.store"
import { MediaChannelConfigUtils } from "../../../rtc/webrtc-media-channel-config"

export class VideoStoreManager {
  private static instance: VideoStoreManager
  // robotId -> storeType -> store (데이터 채널과 동일한 패턴)
  private stores: Map<string, Map<symbol, VideoStore>> = new Map()
  // robotId -> dataType -> channelLabels[] (N:1 관계 추적)
  private dataTypeChannels: Map<string, Map<string, string[]>> = new Map()
  // robotId -> mediaType -> storeType (미디어 타입별 스토어 타입 매핑)
  private mediaTypeStoreTypes: Map<string, Map<string, symbol>> = new Map()

  private constructor() {}

  public static getInstance(): VideoStoreManager {
    if (!VideoStoreManager.instance) {
      VideoStoreManager.instance = new VideoStoreManager()
    }
    return VideoStoreManager.instance
  }

  // 로봇별 비디오 스토어 초기화
  public initializeRobotVideoStores(robotId: string): void {
    if (!this.stores.has(robotId)) {
      this.stores.set(robotId, new Map())
      this.dataTypeChannels.set(robotId, new Map())
      this.mediaTypeStoreTypes.set(robotId, new Map())
      console.log(`VideoStoreManager: Robot ${robotId} video stores initialized`)
    }
  }

  // 로봇별 비디오 스토어 정리
  public cleanupRobotVideoStores(robotId: string): void {
    const robotStores = this.stores.get(robotId)
    if (robotStores) {
      // 모든 스토어 정리
      robotStores.forEach(store => store.destroy())
      robotStores.clear()
    }
    
    this.stores.delete(robotId)
    this.dataTypeChannels.delete(robotId)
    this.mediaTypeStoreTypes.delete(robotId)
    
    console.log(`VideoStoreManager: Robot ${robotId} video stores cleaned up`)
  }

  // 스토어 생성 (없으면 생성, 있으면 기존 반환)
  public createStoreIfNotExists(
    robotId: string,
    storeType: symbol,
    storeFactory: (robotId: string) => VideoStore
  ): VideoStore {
    let robotStores = this.stores.get(robotId)
    if (!robotStores) {
      robotStores = new Map()
      this.stores.set(robotId, robotStores)
    }

    let store = robotStores.get(storeType)
    if (!store) {
      store = storeFactory(robotId)
      robotStores.set(storeType, store)
      console.log(`VideoStoreManager: New VideoStore created: ${String(storeType)} for robot ${robotId}`)
    }

    return store
  }

  // 미디어 타입으로 VideoStore 생성 (메타데이터 기반)
  public createVideoStoreByMediaType(
    robotId: string,
    mediaType: string,
    storeType: symbol,
    storeFactory: (robotId: string, channelLabel: string) => VideoStore
  ): VideoStore | null {
    // 미디어 타입별 스토어 타입 매핑 저장
    let robotMediaTypeStoreTypes = this.mediaTypeStoreTypes.get(robotId)
    if (!robotMediaTypeStoreTypes) {
      robotMediaTypeStoreTypes = new Map<string, symbol>()
      this.mediaTypeStoreTypes.set(robotId, robotMediaTypeStoreTypes)
    }
    robotMediaTypeStoreTypes.set(mediaType, storeType)
    
    // 채널 라벨 생성 (미디어 타입 기반)
    const channelLabel = this.generateChannelLabel(mediaType, robotId)
    
    // 스토어 팩토리 함수 수정 (channelLabel 포함)
    const modifiedStoreFactory = (robotId: string) => storeFactory(robotId, channelLabel)
    
    const store = this.createStoreIfNotExists(robotId, storeType, modifiedStoreFactory)
    
    // 채널 등록
    this.registerChannelForDataType(robotId, mediaType, channelLabel)
    
    console.log(`VideoStoreManager: VideoStore created for media type ${mediaType}`)
    return store
  }

  // 미디어 타입 기반 채널 라벨 생성
  private generateChannelLabel(mediaType: string, robotId: string): string {
    // 기존 채널 수 확인
    const existingChannels = this.getChannelsForDataType(robotId, mediaType)
    const channelIndex = existingChannels.length
    
    return `${mediaType}_track_${channelIndex}`
  }

  // 미디어 타입으로 VideoStore 자동 생성 (위젯에서 사용)
  public createVideoStoreByMediaTypeAuto(
    robotId: string,
    mediaType: string
  ): VideoStore | null {
    // 미디어 타입이 지원되는지 확인
    if (!MediaChannelConfigUtils.isSupportedMediaType(mediaType)) {
      console.warn(`VideoStoreManager: Unsupported media type: ${mediaType}`)
      return null
    }
    
    // 스토어 타입 심볼 가져오기
    const storeType = MediaChannelConfigUtils.getMediaTypeSymbol(mediaType)
    if (!storeType) {
      console.warn(`VideoStoreManager: Symbol not found for media type ${mediaType}`)
      return null
    }
    
    // 기존 스토어가 있는지 확인
    const existingStore = this.getVideoStoreByMediaType(robotId, mediaType)
    if (existingStore) {
      console.log(`VideoStoreManager: Reusing existing VideoStore: ${mediaType} for robot ${robotId}`)
      return existingStore
    }
    
    // 미디어 타입별 스토어 팩토리 매핑
    const storeFactories: Record<string, (robotId: string, channelLabel: string) => VideoStore> = {
      'turtlesim_video': (robotId: string, channelLabel: string) => new TurtlesimVideoStore(robotId, channelLabel),
      // 다른 미디어 타입들 추가 가능
      // 'go2_camera': (robotId: string, channelLabel: string) => new Go2CameraStore(robotId, channelLabel),
      // 'thermal_camera': (robotId: string, channelLabel: string) => new ThermalCameraStore(robotId, channelLabel),
    }
    
    const storeFactory = storeFactories[mediaType]
    if (!storeFactory) {
      console.warn(`VideoStoreManager: No store factory for media type ${mediaType}`)
      return null
    }
    
    console.log(`VideoStoreManager: Creating new VideoStore: ${mediaType} for robot ${robotId}`)
    return this.createVideoStoreByMediaType(robotId, mediaType, storeType, storeFactory)
  }

  // 미디어 타입으로 VideoStore 가져오기
  public getVideoStoreByMediaType(robotId: string, mediaType: string): VideoStore | undefined {
    const robotMediaTypeStoreTypes = this.mediaTypeStoreTypes.get(robotId)
    if (!robotMediaTypeStoreTypes) return undefined
    
    const storeType = robotMediaTypeStoreTypes.get(mediaType)
    if (!storeType) return undefined
    
    const robotStores = this.stores.get(robotId)
    if (!robotStores) return undefined
    
    return robotStores.get(storeType)
  }

  // 데이터 채널과 동일한 패턴: 채널 등록
  public registerChannelForDataType(robotId: string, dataType: string, channelLabel: string) {
    let robotDataTypeChannels = this.dataTypeChannels.get(robotId)
    
    if (!robotDataTypeChannels) {
      robotDataTypeChannels = new Map<string, string[]>()
      this.dataTypeChannels.set(robotId, robotDataTypeChannels)
    }
    
    let channels = robotDataTypeChannels.get(dataType)
    if (!channels) {
      channels = []
      robotDataTypeChannels.set(dataType, channels)
    }
    
    if (!channels.includes(channelLabel)) {
      channels.push(channelLabel)
      console.log(`VideoStoreManager: Video channel registered: ${channelLabel} -> ${dataType} for robot ${robotId}`)
    }
  }

  // 데이터 타입으로 채널들 가져오기
  public getChannelsForDataType(robotId: string, dataType: string): string[] {
    return this.dataTypeChannels.get(robotId)?.get(dataType) || []
  }

  // 채널 라벨로 데이터 타입 찾기
  public getDataTypeForChannel(robotId: string, channelLabel: string): string | undefined {
    const robotDataTypeChannels = this.dataTypeChannels.get(robotId)
    if (!robotDataTypeChannels) return undefined
    
    for (const [dataType, channels] of robotDataTypeChannels.entries()) {
      if (channels.includes(channelLabel)) {
        return dataType
      }
    }
    return undefined
  }

  // 로봇의 모든 비디오 스토어 가져오기
  public getRobotVideoStores(robotId: string): Map<symbol, VideoStore> {
    return this.stores.get(robotId) || new Map()
  }
} 