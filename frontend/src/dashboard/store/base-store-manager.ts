import { DataStore } from "./store"

export interface BaseStoreManager {
  initializeRobotStores(robotId: string): void
  cleanupRobotStores(robotId: string): void
  getStore<T, I = string>(robotId: string, storeType: symbol): DataStore<T, I> | undefined
  createStoreIfNotExists<T, I = string>(
    robotId: string, 
    storeType: symbol, 
    storeFactory: (robotId: string) => DataStore<T, I>
  ): DataStore<T, I>
  registerChannelForDataType(robotId: string, dataType: string, channelLabel: string): void
  getChannelsForDataType(robotId: string, dataType: string): string[]
  getDataTypeForChannel(robotId: string, channelLabel: string): string | undefined
  getRobotChannelMapping(robotId: string): Map<string, string[]>
} 