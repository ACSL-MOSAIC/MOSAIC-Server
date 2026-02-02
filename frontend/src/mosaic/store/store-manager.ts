import type {RobotConfig, RobotConnector} from "@/mosaic"
import type {MosaicStore} from "./interface/mosaic-store.ts"

class RobotConnectorRefMap<V> {
  private map: Map<string, V> = new Map()
  private refCounts: Map<string, number> = new Map()

  public get(key: RobotConnector): V | undefined {
    // TODO: implement
    return undefined
  }

  public set(key: RobotConnector, value: V): void {
    // TODO: implement
  }

  public incrementRefCount(key: RobotConnector): void {
    // TODO: implement
  }

  public decrementRefCount(key: RobotConnector): void {
    // TODO: implement
  }

  public getRefCount(key: RobotConnector): number {
    // TODO: implement
    return 0
  }

  public delete(key: RobotConnector): void {
    // TODO: implement
  }
}

export class StoreManager {
  private mosaicStores: RobotConnectorRefMap<MosaicStore> =
    new RobotConnectorRefMap()

  public getOrCreateStore(
    robotConnector: RobotConnector,
    robotConfig: RobotConfig,
  ): MosaicStore {
    // TODO: implement
    throw new Error("Not implemented")
  }

  public releaseStore(robotConnector: RobotConnector): void {
    // TODO: implement
  }

  private resolveConnectorType(robotConnector: RobotConnector): string {
    // TODO: implement
    throw new Error("Not implemented")
  }
}
