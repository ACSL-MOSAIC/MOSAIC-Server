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

  // 로봇의 비디오 스토어 컨테이너 초기화
  public initializeRobotVideoStores(robotId: string): void {
    const robotStores = new Map<symbol, VideoStore>()
    this.stores.set(robotId, robotStores)
    
    // 데이터 타입별 채널 추적 초기화
    this.dataTypeChannels.set(robotId, new Map())
    
    // 미디어 타입별 스토어 타입 매핑 초기화
    this.mediaTypeStoreTypes.set(robotId, new Map())
    
    console.log(`VideoStoreManager: 로봇 ${robotId} 비디오 스토어 컨테이너 초기화`)
  }

  // 로봇의 모든 비디오 스토어 정리
  public cleanupRobotVideoStores(robotId: string): void {
    const robotStores = this.stores.get(robotId)
    if (robotStores) {
      // 모든 비디오 스토어 정리
      robotStores.forEach(store => store.destroy())
      this.stores.delete(robotId)
      this.dataTypeChannels.delete(robotId)
      this.mediaTypeStoreTypes.delete(robotId)
      console.log(`VideoStoreManager: 로봇 ${robotId} 비디오 스토어 컨테이너 정리 완료`)
    }
  }

  // 데이터 채널과 동일한 패턴: createStoreIfNotExists
  public createStoreIfNotExists(
    robotId: string,
    storeType: symbol,
    storeFactory: (robotId: string) => VideoStore
  ): VideoStore {
    let robotStores = this.stores.get(robotId)
    
    if (!robotStores) {
      robotStores = new Map<symbol, VideoStore>()
      this.stores.set(robotId, robotStores)
      console.log(`VideoStoreManager: 로봇 ${robotId} 비디오 스토어 컨테이너 동적 생성`)
    }
    
    let store = robotStores.get(storeType)
    
    if (!store) {
      store = storeFactory(robotId)
      robotStores.set(storeType, store)
      console.log(`VideoStoreManager: VideoStore 생성됨: ${String(storeType)} for robot ${robotId}`)
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
    
    console.log(`VideoStoreManager: 미디어 타입 ${mediaType}으로 VideoStore 생성 완료`)
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
      console.warn(`VideoStoreManager: 지원되지 않는 미디어 타입: ${mediaType}`)
      return null
    }
    
    // 스토어 타입 심볼 가져오기
    const storeType = MediaChannelConfigUtils.getMediaTypeSymbol(mediaType)
    if (!storeType) {
      console.warn(`VideoStoreManager: 미디어 타입 ${mediaType}에 대한 심볼을 찾을 수 없음`)
      return null
    }
    
    // 기존 스토어가 있는지 확인
    const existingStore = this.getVideoStoreByMediaType(robotId, mediaType)
    if (existingStore) {
      console.log(`VideoStoreManager: 기존 VideoStore 재사용: ${mediaType} for robot ${robotId}`)
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
      console.warn(`VideoStoreManager: 미디어 타입 ${mediaType}에 대한 스토어 팩토리가 없음`)
      return null
    }
    
    console.log(`VideoStoreManager: 새로운 VideoStore 생성: ${mediaType} for robot ${robotId}`)
    return this.createVideoStoreByMediaType(robotId, mediaType, storeType, storeFactory)
  }

  // 특정 채널의 비디오 스토어 가져오기 (기존 호환성)
  public getVideoStore(robotId: string, channelLabel: string): VideoStore | undefined {
    // 채널 라벨로 데이터 타입 찾기
    const dataType = this.getDataTypeForChannel(robotId, channelLabel)
    if (!dataType) {
      console.warn(`채널 라벨 ${channelLabel}에 대한 데이터 타입을 찾을 수 없음`)
      return undefined
    }

    // 모든 스토어에서 해당 데이터 타입의 스토어 찾기
    const robotStores = this.stores.get(robotId)
    if (!robotStores) return undefined

    for (const [storeType, store] of robotStores.entries()) {
      if (String(storeType).includes(dataType)) {
        return store
      }
    }

    return undefined
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
      console.log(`VideoStoreManager: 비디오 채널 등록: ${channelLabel} -> ${dataType} for robot ${robotId}`)
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

  // 로봇의 모든 비디오 채널 라벨 가져오기
  public getRobotVideoChannels(robotId: string): string[] {
    const robotDataTypeChannels = this.dataTypeChannels.get(robotId)
    if (!robotDataTypeChannels) return []
    
    const allChannels: string[] = []
    robotDataTypeChannels.forEach(channels => {
      allChannels.push(...channels)
    })
    return allChannels
  }

  // 특정 채널의 비디오 스토어 제거
  public removeVideoStore(robotId: string, channelLabel: string): void {
    const dataType = this.getDataTypeForChannel(robotId, channelLabel)
    if (!dataType) {
      console.warn(`채널 라벨 ${channelLabel}에 대한 데이터 타입을 찾을 수 없음`)
      return
    }

    const robotStores = this.stores.get(robotId)
    if (!robotStores) return

    // 해당 데이터 타입의 스토어 찾아서 제거
    for (const [storeType, store] of robotStores.entries()) {
      if (String(storeType).includes(dataType)) {
        store.destroy()
        robotStores.delete(storeType)
        console.log(`VideoStoreManager: 비디오 스토어 제거됨: ${String(storeType)} for robot ${robotId}`)
        break
      }
    }
  }

  // 모든 비디오 스토어 상태 로그
  public logAllVideoStores(): void {
    console.log('VideoStoreManager: 현재 모든 비디오 스토어 상태:')
    for (const [robotId, robotStores] of this.stores.entries()) {
      console.log(`  로봇 ${robotId}:`)
      for (const [storeType, store] of robotStores.entries()) {
        console.log(`    - ${String(storeType)}: ${store.isStreamActive() ? '활성' : '비활성'}`)
      }
    }
  }
} 