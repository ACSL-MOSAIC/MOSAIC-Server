import type {BaseStoreManager} from "../../base-store-manager"
import type {WriteOnlyStore} from "./write-only-store"

export class WriteOnlyStoreManager implements BaseStoreManager {
  private static instance: WriteOnlyStoreManager
  // robotId -> storeType -> store
  private stores: Map<string, Map<symbol, WriteOnlyStore<any, any>>> = new Map()
  // robotId -> dataType -> channelLabels[] (N:1 relationship tracking)
  private dataTypeChannels: Map<string, Map<string, string[]>> = new Map()
  // Connection state monitoring callbacks
  private connectionStateCallbacks: Map<
    string,
    ((
      robotId: string,
      storeType: string,
      connected: boolean,
      state: string,
    ) => void)[]
  > = new Map()

  private constructor() {
  }

  public static getInstance(): WriteOnlyStoreManager {
    if (!WriteOnlyStoreManager.instance) {
      WriteOnlyStoreManager.instance = new WriteOnlyStoreManager()
    }
    return WriteOnlyStoreManager.instance
  }

  public initializeRobotStores(robotId: string) {
    const robotStores = new Map<symbol, WriteOnlyStore<any, any>>()
    this.stores.set(robotId, robotStores)

    // Initialize data type channel tracking
    this.dataTypeChannels.set(robotId, new Map())

    // console.log(`Robot ${robotId} write-only store container initialized`)
  }

  public cleanupRobotStores(robotId: string) {
    const robotStores = this.stores.get(robotId)
    if (robotStores) {
      // Clean up data channels for all write-only stores
      robotStores.forEach((store) => {
        store.cleanupDataChannel()
      })
    }

    this.stores.delete(robotId)
    this.dataTypeChannels.delete(robotId)
    // console.log(`Robot ${robotId} write-only stores cleanup completed`)
  }

  public getStore<T, I = string>(
    robotId: string,
    storeType: symbol,
  ): WriteOnlyStore<T, I> | undefined {
    return this.stores.get(robotId)?.get(storeType) as WriteOnlyStore<T, I>
  }

  public createStoreIfNotExists<T, I = string>(
    robotId: string,
    storeType: symbol,
    storeFactory: (robotId: string) => WriteOnlyStore<T, I>,
  ): WriteOnlyStore<T, I> {
    let robotStores = this.stores.get(robotId)

    if (!robotStores) {
      robotStores = new Map<symbol, WriteOnlyStore<any, any>>()
      this.stores.set(robotId, robotStores)
      // console.log(
      //   `Robot ${robotId} write-only store container dynamically created`,
      // )
    }

    let store = robotStores.get(storeType) as WriteOnlyStore<T, I>

    if (!store) {
      store = storeFactory(robotId)
      robotStores.set(storeType, store)

      // Register connection state change listener
      this.setupStoreConnectionListener(robotId, storeType, store)

      // console.log(
      //   `Write-only store created: ${String(storeType)} for robot ${robotId}`,
      // )
    }

    return store
  }

  // Setup store connection state listener
  private setupStoreConnectionListener(
    robotId: string,
    storeType: symbol,
    store: WriteOnlyStore<any, any>,
  ): void {
    store.onConnectionStateChange((connected, state) => {
      // console.log(
      //   `WriteOnlyStoreManager: ${robotId}'s ${String(storeType)} connection state changed:`,
      //   { connected, state },
      // )

      // Notify registered callbacks
      const callbacks = this.connectionStateCallbacks.get(robotId) || []
      callbacks.forEach((callback) => {
        try {
          callback(robotId, String(storeType), connected, state)
        } catch (error) {
          console.error("Connection state callback execution error:", error)
        }
      })
    })
  }

  // Register connection state change callback
  public onConnectionStateChange(
    robotId: string,
    callback: (
      robotId: string,
      storeType: string,
      connected: boolean,
      state: string,
    ) => void,
  ): () => void {
    let callbacks = this.connectionStateCallbacks.get(robotId)
    if (!callbacks) {
      callbacks = []
      this.connectionStateCallbacks.set(robotId, callbacks)
    }

    callbacks.push(callback)

    // Notify current state immediately
    const robotStores = this.stores.get(robotId)
    if (robotStores) {
      robotStores.forEach((store, storeType) => {
        const state = store.getChannelState()
        callback(robotId, String(storeType), state.connected, state.state)
      })
    }

    // Return callback removal function
    return () => {
      const callbacks = this.connectionStateCallbacks.get(robotId)
      if (callbacks) {
        const index = callbacks.indexOf(callback)
        if (index > -1) {
          callbacks.splice(index, 1)
        }
      }
    }
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
      //   `Write-only channel registered: ${channelLabel} -> ${dataType} for robot ${robotId}`,
      // )
    }
  }

  public getChannelsForDataType(robotId: string, dataType: string): string[] {
    return this.dataTypeChannels.get(robotId)?.get(dataType) || []
  }

  public getRobotChannelMapping(robotId: string): Map<string, string[]> {
    return this.dataTypeChannels.get(robotId) || new Map()
  }

  // Write-only store specific methods
  public getWriteOnlyStores(
    robotId: string,
  ): Map<symbol, WriteOnlyStore<any, any>> {
    return this.stores.get(robotId) || new Map()
  }

  public getConnectedWriteOnlyStores(
    robotId: string,
  ): WriteOnlyStore<any, any>[] {
    const robotStores = this.stores.get(robotId)
    if (!robotStores) return []

    return Array.from(robotStores.values()).filter((store) =>
      store.isChannelConnected(),
    )
  }

  // Write-only stores always need data channels, so force creation
  public ensureWriteOnlyStoreExists<T, I = string>(
    robotId: string,
    storeType: symbol,
    storeFactory: (robotId: string) => WriteOnlyStore<T, I>,
  ): WriteOnlyStore<T, I> {
    let store = this.getStore<T, I>(robotId, storeType)

    if (!store) {
      store = this.createStoreIfNotExists(robotId, storeType, storeFactory)
      // console.log(
      //   `Write-only store forced creation: ${String(storeType)} for robot ${robotId}`,
      // )
    }

    return store
  }

  // Check connection status of all write-only stores
  public getWriteOnlyStoresStatus(robotId: string): {
    [storeType: string]: boolean
  } {
    const robotStores = this.stores.get(robotId)
    if (!robotStores) return {}

    const status: { [storeType: string]: boolean } = {}
    robotStores.forEach((store, storeType) => {
      status[String(storeType)] = store.isChannelConnected()
    })

    return status
  }

  // Return detailed status information for all write-only stores
  public getWriteOnlyStoresDetailedStatus(robotId: string): {
    [storeType: string]: {
      connected: boolean
      state: string
      label?: string
      bufferedAmount: number
      protocol?: string
    }
  } {
    const robotStores = this.stores.get(robotId)
    if (!robotStores) return {}

    const status: { [storeType: string]: any } = {}
    robotStores.forEach((store, storeType) => {
      status[String(storeType)] = store.getChannelState()
    })

    return status
  }

  // Get connection summary for all stores of a specific robot
  public getRobotConnectionSummary(robotId: string): {
    totalStores: number
    connectedStores: number
    disconnectedStores: number
    connectionRate: number
    stores: { [storeType: string]: { connected: boolean; state: string } }
  } {
    const robotStores = this.stores.get(robotId)
    if (!robotStores) {
      return {
        totalStores: 0,
        connectedStores: 0,
        disconnectedStores: 0,
        connectionRate: 0,
        stores: {},
      }
    }

    const stores: {
      [storeType: string]: { connected: boolean; state: string }
    } = {}
    let connectedCount = 0

    robotStores.forEach((store, storeType) => {
      const state = store.getChannelState()
      stores[String(storeType)] = {
        connected: state.connected,
        state: state.state,
      }

      if (state.connected) {
        connectedCount++
      }
    })

    const totalStores = robotStores.size
    const disconnectedStores = totalStores - connectedCount
    const connectionRate =
      totalStores > 0 ? (connectedCount / totalStores) * 100 : 0

    return {
      totalStores,
      connectedStores: connectedCount,
      disconnectedStores,
      connectionRate,
      stores,
    }
  }

  // Get connection summary for all robots
  public getAllRobotsConnectionSummary(): {
    [robotId: string]: {
      totalStores: number
      connectedStores: number
      disconnectedStores: number
      connectionRate: number
    }
  } {
    const summary: { [robotId: string]: any } = {}

    for (const robotId of this.stores.keys()) {
      summary[robotId] = this.getRobotConnectionSummary(robotId)
    }

    return summary
  }
}
