import {MediaChannelConfigUtils} from "@/rtc/config/webrtc-media-channel-config.ts"
import {VideoStore} from "./video-store"

export class VideoStoreManager {
  private static instance: VideoStoreManager
  // robotId -> storeType -> store (same pattern as data channels)
  private stores: Map<string, Map<symbol, VideoStore>> = new Map()
  // robotId -> dataType -> channelLabels[] (N:1 relationship tracking)
  private dataTypeChannels: Map<string, Map<string, string[]>> = new Map()
  // robotId -> mediaType -> storeType (media type to store type mapping)
  private mediaTypeStoreTypes: Map<string, Map<string, symbol>> = new Map()

  private constructor() {
  }

  public static getInstance(): VideoStoreManager {
    if (!VideoStoreManager.instance) {
      VideoStoreManager.instance = new VideoStoreManager()
    }
    return VideoStoreManager.instance
  }

  // Initialize video stores for a specific robot
  public initializeRobotVideoStores(robotId: string): void {
    if (!this.stores.has(robotId)) {
      this.stores.set(robotId, new Map())
      this.dataTypeChannels.set(robotId, new Map())
      this.mediaTypeStoreTypes.set(robotId, new Map())
      // console.log(
      //   `VideoStoreManager: Robot ${robotId} video stores initialized`,
      // )
    }
  }

  // Clean up video stores for a specific robot
  public cleanupRobotVideoStores(robotId: string): void {
    const robotStores = this.stores.get(robotId)
    if (robotStores) {
      // Clean up all stores
      for (const [, store] of robotStores.entries()) {
        store.destroy() // Assuming VideoStore has a destroy method
      }
      robotStores.clear()
    }

    this.stores.delete(robotId)
    this.dataTypeChannels.delete(robotId)
    this.mediaTypeStoreTypes.delete(robotId)

    // console.log(`VideoStoreManager: Robot ${robotId} video stores cleaned up`)
  }

  // Create store if it doesn't exist, otherwise return existing store
  public createStoreIfNotExists(
    robotId: string,
    storeType: symbol,
    storeFactory: (robotId: string) => VideoStore,
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
      // console.log(
      //   `VideoStoreManager: New VideoStore created: ${String(storeType)} for robot ${robotId}`,
      // )
    }

    return store
  }

  // Create VideoStore by media type (metadata-based)
  public createVideoStoreByMediaType(
    robotId: string,
    mediaType: string,
    storeType: symbol,
    storeFactory: (robotId: string, channelLabel: string) => VideoStore,
  ): VideoStore | null {
    // Store media type to store type mapping
    let robotMediaTypeStoreTypes = this.mediaTypeStoreTypes.get(robotId)
    if (!robotMediaTypeStoreTypes) {
      robotMediaTypeStoreTypes = new Map<string, symbol>()
      this.mediaTypeStoreTypes.set(robotId, robotMediaTypeStoreTypes)
    }
    robotMediaTypeStoreTypes.set(mediaType, storeType)

    // Generate channel label (media type based)
    const channelLabel = this.generateChannelLabel(mediaType, robotId)

    // Modify store factory function (include channelLabel)
    const modifiedStoreFactory = (robotId: string) =>
      storeFactory(robotId, channelLabel)

    const store = this.createStoreIfNotExists(
      robotId,
      storeType,
      modifiedStoreFactory,
    )

    // Register channel
    this.registerChannelForDataType(robotId, mediaType, channelLabel)

    // console.log(
    //   `VideoStoreManager: VideoStore created for media type ${mediaType}`,
    // )
    return store
  }

  // Generate channel label based on media type
  private generateChannelLabel(mediaType: string, robotId: string): string {
    // Check existing channel count
    const existingChannels = this.getChannelsForDataType(robotId, mediaType)
    const channelIndex = existingChannels.length

    return `${mediaType}_track_${channelIndex}`
  }

  // Auto-create VideoStore by media type (used by widgets)
  public createVideoStoreByMediaTypeAuto(
    robotId: string,
    mediaType: string,
  ): VideoStore | null {
    // Check if media type is supported
    if (!MediaChannelConfigUtils.isSupportedMediaType(mediaType)) {
      console.warn(`VideoStoreManager: Unsupported media type: ${mediaType}`)
      return null
    }

    // Get store type symbol
    const storeType = MediaChannelConfigUtils.getMediaTypeSymbol(mediaType)
    if (!storeType) {
      console.warn(
        `VideoStoreManager: Symbol not found for media type ${mediaType}`,
      )
      return null
    }

    // Check if existing store exists
    const existingStore = this.getVideoStoreByMediaType(robotId, mediaType)
    if (existingStore) {
      return existingStore
    }

    // Media type to store factory mapping
    const storeFactories: Record<
      string,
      (robotId: string, channelLabel: string) => VideoStore
    > = {
      video_stream: (robotId: string, channelLabel: string) =>
        new VideoStore(robotId, channelLabel),
      video_stream_v2: (robotId: string, channelLabel: string) =>
        new VideoStore(robotId, channelLabel),
    }

    const storeFactory = storeFactories[mediaType]
    if (!storeFactory) {
      console.warn(
        `VideoStoreManager: No store factory for media type ${mediaType}`,
      )
      return null
    }

    // console.log(
    //   `VideoStoreManager: Creating new VideoStore: ${mediaType} for robot ${robotId}`,
    // )
    return this.createVideoStoreByMediaType(
      robotId,
      mediaType,
      storeType,
      storeFactory,
    )
  }

  // Get VideoStore by media type
  public getVideoStoreByMediaType(
    robotId: string,
    mediaType: string,
  ): VideoStore | undefined {
    const robotMediaTypeStoreTypes = this.mediaTypeStoreTypes.get(robotId)
    if (!robotMediaTypeStoreTypes) return undefined

    const storeType = robotMediaTypeStoreTypes.get(mediaType)
    if (!storeType) return undefined

    const robotStores = this.stores.get(robotId)
    if (!robotStores) return undefined

    return robotStores.get(storeType)
  }

  // Same pattern as data channels: register channel
  public registerChannelForDataType(
    robotId: string,
    dataType: string,
    channelLabel: string,
  ) {
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
      // console.log(
      //   `VideoStoreManager: Video channel registered: ${channelLabel} -> ${dataType} for robot ${robotId}`,
      // )
    }
  }

  // Get channels by data type
  public getChannelsForDataType(robotId: string, dataType: string): string[] {
    return this.dataTypeChannels.get(robotId)?.get(dataType) || []
  }

  // Find data type by channel label
  public getDataTypeForChannel(
    robotId: string,
    channelLabel: string,
  ): string | undefined {
    const robotDataTypeChannels = this.dataTypeChannels.get(robotId)
    if (!robotDataTypeChannels) return undefined

    for (const [dataType, channels] of robotDataTypeChannels.entries()) {
      if (channels.includes(channelLabel)) {
        return dataType
      }
    }
    return undefined
  }

  // Get all video stores for a robot
  public getRobotVideoStores(robotId: string): Map<symbol, VideoStore> {
    return this.stores.get(robotId) || new Map()
  }
}
