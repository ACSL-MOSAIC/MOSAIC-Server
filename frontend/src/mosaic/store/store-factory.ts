import type {RobotConnector} from "@/mosaic"
import type {MosaicStore} from "./interface/mosaic-store.ts"

export class StoreFactory {
  // storeFactories의 key는 dataType, value는 robotConnector를 인자로 받아 MosaicStore 인스턴스를 반환하는 함수
  private storeFactories: Map<
    string,
    (robotConnector: RobotConnector) => MosaicStore
  > = new Map()

  public registerMosaicStore<T extends MosaicStore>(
    // StoreClass는 MosaicStore 상속받은 클래스, getDataType()으로 타입 결정하도록 함
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
