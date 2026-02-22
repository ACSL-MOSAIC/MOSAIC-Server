import type { RobotConnector } from "@/mosaic"
import { MediaStreamStore } from "@/mosaic/store/interface/media-stream-store.ts"
import type { MosaicStore } from "./interface/mosaic-store.ts"

const modules = import.meta.glob<Record<string, unknown>>("./impl/*.ts", {
  eager: true,
})

const storeRegistry = new Map<string, typeof MosaicStore>()

for (const module of Object.values(modules)) {
  for (const exported of Object.values(module)) {
    if (
      typeof exported === "function" &&
      ((exported as typeof MosaicStore).connectorType !== "undefined" ||
        (exported as typeof MosaicStore).connectorType !== "template")
    ) {
      const StoreClass = exported as typeof MosaicStore
      storeRegistry.set(StoreClass.connectorType, StoreClass)
    }
  }
}

export class StoreFactory {
  public createStore(
    connectorType: string,
    robotConnector: RobotConnector,
  ): MosaicStore | null {
    if (connectorType === "media") {
      return new MediaStreamStore(robotConnector)
    }
    const StoreClass = storeRegistry.get(connectorType)
    if (StoreClass === undefined) return null
    return new (
      StoreClass as unknown as new (
        robotConnector: RobotConnector,
      ) => MosaicStore
    )(robotConnector)
  }
}
