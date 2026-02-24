import type { RobotConfig, RobotConnector } from "@/mosaic"
import type { MosaicStore } from "./interface/mosaic-store.ts"
import { StoreFactory } from "./store-factory.ts"

class RobotConnectorRefMap<V> {
  private map: Map<string, V> = new Map()
  private refCounts: Map<string, number> = new Map()

  public get(key: RobotConnector): V | undefined {
    return this.map.get(key.serialize())
  }

  public set(key: RobotConnector, value: V): void {
    this.map.set(key.serialize(), value)
    this.refCounts.set(key.serialize(), 1)
  }

  public incrementRefCount(key: RobotConnector): void {
    const k = key.serialize()
    const current = this.refCounts.get(k) ?? 0
    this.refCounts.set(k, current + 1)
  }

  public decrementRefCount(key: RobotConnector): void {
    const k = key.serialize()
    const current = this.refCounts.get(k) ?? 0
    if (current > 0) {
      this.refCounts.set(k, current - 1)
    }
  }

  public getRefCount(key: RobotConnector): number {
    return this.refCounts.get(key.serialize()) ?? 0
  }

  public delete(key: RobotConnector): void {
    this.map.delete(key.serialize())
    this.refCounts.delete(key.serialize())
  }
}

export class StoreManager {
  private mosaicStores: RobotConnectorRefMap<MosaicStore> =
    new RobotConnectorRefMap()
  private storeFactory: StoreFactory = new StoreFactory()

  public getOrCreateStore(
    robotConnector: RobotConnector,
    robotConfig: RobotConfig,
  ): MosaicStore | null {
    // If store already exists, only increment ref count
    const existing = this.mosaicStores.get(robotConnector)
    if (existing) {
      this.mosaicStores.incrementRefCount(robotConnector)
      return existing
    }

    // If not found, create new store and resolve connector type
    const connectorType = this.resolveConnectorType(robotConnector, robotConfig)
    const store = this.storeFactory.createStore(connectorType, robotConnector)
    if (store === null) {
      console.error(`Failed to create store for connector: ${connectorType}`)
      return null
    }

    this.mosaicStores.set(robotConnector, store)
    return store
  }

  public releaseStore(robotConnector: RobotConnector): boolean {
    const store = this.mosaicStores.get(robotConnector)
    if (store === undefined) return false

    // Decrement ref count; remove store when it reaches 0
    this.mosaicStores.decrementRefCount(robotConnector)
    if (this.mosaicStores.getRefCount(robotConnector) === 0) {
      this.mosaicStores.delete(robotConnector)
      return true
    }
    return false
  }

  private resolveConnectorType(
    robotConnector: RobotConnector,
    robotConfig: RobotConfig,
  ): string {
    const connector = robotConfig.connectors.find(
      (c) => c.connectorId === robotConnector.connectorId,
    )
    if (connector === undefined) {
      throw new Error(`Connector not found: ${robotConnector.connectorId}`)
    }
    return connector.connectorType
  }
}
