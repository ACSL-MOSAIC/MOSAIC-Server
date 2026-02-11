import type {RobotConnector} from "@/mosaic"
import type {MosaicStore} from "./interface/mosaic-store.ts"

export class StoreFactory {
  // Key: dataType; value: function that takes robotConnector and returns a MosaicStore instance
  private storeFactories: Map<
    string,
    (robotConnector: RobotConnector) => MosaicStore
  > = new Map()

  public registerMosaicStore<T extends MosaicStore>(
    // StoreClass extends MosaicStore; type is determined via getDataType()
    StoreClass: (new (robotConnector: RobotConnector) => T) & {
      getDataType(): string
    },
  ): void {
    this.storeFactories.set(StoreClass.getDataType(), (robotConnector) =>
      new StoreClass(robotConnector),
    )
  }

  public createStore(
    connectorType: string,
    robotConnector: RobotConnector,
  ): MosaicStore | null {
    const factory = this.storeFactories.get(connectorType)
    if (factory === undefined) return null
    return factory(robotConnector)
  }
}
