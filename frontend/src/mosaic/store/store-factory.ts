import type {RobotConnector} from "@/mosaic"
import type {MosaicStore} from "./interface/mosaic-store.ts"

export class StoreFactory {
  private storeFactories: Map<
    string,
    (robotConnector: RobotConnector) => MosaicStore
  > = new Map()

  public registerMosaicStore<T extends MosaicStore>(
    StoreClass: new () => T,
  ): void {
    // TODO: implement
  }

  public createStore(
    connectorType: string,
    robotConnector: RobotConnector,
  ): MosaicStore | null {
    // TODO: implement
    return null
  }
}
