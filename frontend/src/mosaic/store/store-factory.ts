import type { RobotConnector } from "@/mosaic";

import type { MosaicStore } from "./interface/mosaic-store.ts";

const modules = import.meta.glob<Record<string, unknown>>("../../stores/*/*.ts", {
  eager: true,
});

const storeRegistry = new Map<string, typeof MosaicStore>();

for (const [path, module] of Object.entries(modules)) {
  const match = path.match(/\/([^/]+)\/\1\.ts$/);
  if (!match) continue;
  const className = match[1];
  const StoreClass = module[className] as typeof MosaicStore | undefined;
  if (typeof StoreClass === "function") {
    storeRegistry.set(className, StoreClass);
  }
}

export class StoreFactory {
  public createStore(connectorType: string, robotConnector: RobotConnector): MosaicStore | null {
    const StoreClass = storeRegistry.get(connectorType);
    if (StoreClass === undefined) return null;
    return new (StoreClass as unknown as new (robotConnector: RobotConnector) => MosaicStore)(
      robotConnector,
    );
  }
}
