import type {BaseStoreManager} from "../../base-store-manager"
import type {ReadOnlyStore} from "./read-only-store"

export class ReadOnlyStoreManager implements BaseStoreManager {
  private static instance: ReadOnlyStoreManager
  // robotId -> storeType -> store
  private stores: Map<string, Map<symbol, ReadOnlyStore<any, any>>> = new Map()
  // robotId -> dataType -> channelLabels[] (N:1 relationship tracking)
  private dataTypeChannels: Map<string, Map<string, string[]>> = new Map()

  private constructor() {
  }

  public static getInstance(): ReadOnlyStoreManager {
    if (!ReadOnlyStoreManager.instance) {
      ReadOnlyStoreManager.instance = new ReadOnlyStoreManager()
    }
    return ReadOnlyStoreManager.instance
  }

  public initializeRobotStores(robotId: string) {
    const robotStores = new Map<symbol, ReadOnlyStore<any, any>>()
    this.stores.set(robotId, robotStores)

    // Initialize data type channel tracking
    this.dataTypeChannels.set(robotId, new Map())

    // console.log(`Robot ${robotId} read-only store container initialized`)
  }

  public cleanupRobotStores(robotId: string) {
    const robotStores = this.stores.get(robotId)
    if (robotStores) {
      // Clean up data channels for all read-only stores
      robotStores.forEach((store) => {
        store.cleanupDataChannel()
      })
    }

    this.stores.delete(robotId)
    this.dataTypeChannels.delete(robotId)
    // console.log(`Robot ${robotId} read-only stores cleanup completed`)
  }

  public getStore<T, I = string>(
    robotId: string,
    storeType: symbol,
  ): ReadOnlyStore<T, I> | undefined {
    return this.stores.get(robotId)?.get(storeType) as ReadOnlyStore<T, I>
  }

  public createStoreIfNotExists<T, I = string>(
    robotId: string,
    storeType: symbol,
    storeFactory: (robotId: string) => ReadOnlyStore<T, I>,
  ): ReadOnlyStore<T, I> {
    let robotStores = this.stores.get(robotId)

    if (!robotStores) {
      robotStores = new Map<symbol, ReadOnlyStore<any, any>>()
      this.stores.set(robotId, robotStores)
      // console.log(
      //   `Robot ${robotId} read-only store container dynamically created`,
      // )
    }

    let store = robotStores.get(storeType) as ReadOnlyStore<T, I>

    if (!store) {
      store = storeFactory(robotId)
      robotStores.set(storeType, store)
      // console.log(
      //   `Read-only store created: ${String(storeType)} for robot ${robotId}`,
      // )
    }

    return store
  }

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
      //   `Read-only channel registered: ${channelLabel} -> ${dataType} for robot ${robotId}`,
      // )
    }
  }

  public getChannelsForDataType(robotId: string, dataType: string): string[] {
    return this.dataTypeChannels.get(robotId)?.get(dataType) || []
  }

  public getRobotChannelMapping(robotId: string): Map<string, string[]> {
    return this.dataTypeChannels.get(robotId) || new Map()
  }

  public getReadOnlyStores(
    robotId: string,
  ): Map<symbol, ReadOnlyStore<any, any>> {
    return this.stores.get(robotId) || new Map()
  }

  public getConnectedReadOnlyStores(
    robotId: string,
  ): ReadOnlyStore<any, any>[] {
    const robotStores = this.stores.get(robotId)
    if (!robotStores) return []

    return Array.from(robotStores.values()).filter((store) =>
      store.isChannelConnected(),
    )
  }
}
