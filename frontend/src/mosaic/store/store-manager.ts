import type {RobotConfig, RobotConnector} from "@/mosaic"
import type {MosaicStore} from "./interface/mosaic-store.ts"
import {StoreFactory} from "./store-factory.ts"

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
  ): MosaicStore {
    // 이미 존재하는 스토어면 ref count만 증가
    const existing = this.mosaicStores.get(robotConnector)
    if (existing !== undefined) {
      this.mosaicStores.incrementRefCount(robotConnector)
      return existing
    }

    // 존재하지 않을 시 새로 생성, connector type 결정
    const connectorType = this.resolveConnectorType(
      robotConnector,
      robotConfig,
    )
    const store = this.storeFactory.createStore(connectorType, robotConnector)
    if (store === null) {
      throw new Error(`Unknown connector type: ${connectorType}`)
    }

    this.mosaicStores.set(robotConnector, store)
    return store
  }

  public releaseStore(robotConnector: RobotConnector): void {
    const store = this.mosaicStores.get(robotConnector)
    if (store === undefined) return

    // ref count 감소, 0이 되면 스토어 삭제
    this.mosaicStores.decrementRefCount(robotConnector)
    if (this.mosaicStores.getRefCount(robotConnector) === 0) {
      this.mosaicStores.delete(robotConnector)
    }
  }

  private resolveConnectorType(
    robotConnector: RobotConnector,
    robotConfig: RobotConfig,
  ): string {
    const connector = robotConfig.connectors.find(
      (c) => c.connectorId === robotConnector.connectorId,
    )
    if (connector === undefined) {
      throw new Error(
        `Connector not found: ${robotConnector.connectorId} in robot ${robotConfig.id}`,
      )
    }
    return connector.dataType
  }
}
