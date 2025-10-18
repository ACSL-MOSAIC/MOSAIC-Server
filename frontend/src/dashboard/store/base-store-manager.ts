import type {DataStore} from "./store"

/**
 * Base interface for store managers
 * Provides common functionality for managing data stores across different channel types
 */
export interface BaseStoreManager {
  /**
   * Initialize stores for a specific robot
   * @param robotId - The robot identifier
   */
  initializeRobotStores(robotId: string): void

  /**
   * Clean up all stores for a specific robot
   * @param robotId - The robot identifier
   */
  cleanupRobotStores(robotId: string): void

  /**
   * Get a store by robot ID and store type
   * @param robotId - The robot identifier
   * @param storeType - The store type symbol
   * @returns The store instance or undefined if not found
   */
  getStore<T, I = string>(
    robotId: string,
    storeType: symbol,
  ): DataStore<T, I> | undefined

  /**
   * Create a store if it doesn't exist, otherwise return existing store
   * @param robotId - The robot identifier
   * @param storeType - The store type symbol
   * @param storeFactory - Factory function to create the store
   * @returns The store instance
   */
  createStoreIfNotExists<T, I = string>(
    robotId: string,
    storeType: symbol,
    storeFactory: (robotId: string) => DataStore<T, I>,
  ): DataStore<T, I>

  /**
   * Register a channel for a specific data type
   * @param robotId - The robot identifier
   * @param dataType - The data type string
   * @param channelLabel - The channel label
   */
  registerChannelForDataType(
    robotId: string,
    dataType: string,
    channelLabel: string,
  ): void

  /**
   * Get all channels for a specific data type
   * @param robotId - The robot identifier
   * @param dataType - The data type string
   * @returns Array of channel labels
   */
  getChannelsForDataType(robotId: string, dataType: string): string[]

  /**
   * Get all channel mappings for a robot
   * @param robotId - The robot identifier
   * @returns Map of data types to channel labels
   */
  getRobotChannelMapping(robotId: string): Map<string, string[]>
}
