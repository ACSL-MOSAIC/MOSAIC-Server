import type { MosaicStore, StoreType } from "@/mosaic/store/interface/mosaic-store.ts";

import { RobotConnector } from "@/mosaic";

const modules = import.meta.glob<Record<string, unknown>>("../*/*.ts", { eager: true });

type StoreClassCtor = new (connector: RobotConnector) => MosaicStore;

export class StoreFactory {
  private static instance: StoreFactory;
  private readonly storeClassMap = new Map<string, StoreClassCtor>();
  private readonly storeTypeMap = new Map<string, StoreType>();

  private constructor() {
    const dummyConnector = new RobotConnector("__dummy__", "__dummy__");

    for (const [path, module] of Object.entries(modules)) {
      const match = path.match(/\/([^/]+)\/\1\.ts$/);
      if (!match) continue;
      const className = match[1];

      const StoreClass = module[className] as StoreClassCtor | undefined;
      if (typeof StoreClass !== "function") continue;

      try {
        const instance = new StoreClass(dummyConnector);
        this.storeClassMap.set(className, StoreClass);
        this.storeTypeMap.set(className, instance.getStoreType());
      } catch {
        // skip stores that cannot be instantiated without additional setup
      }
    }
  }

  public static getInstance(): StoreFactory {
    return this.instance || (this.instance = new StoreFactory());
  }

  public createStore(connectorType: string, robotConnector: RobotConnector): MosaicStore | null {
    const StoreClass = this.storeClassMap.get(connectorType);
    if (!StoreClass) return null;
    return new StoreClass(robotConnector);
  }

  public getAvailableStoreTypes(): string[] {
    return [...this.storeTypeMap.keys()].sort();
  }

  public getAvailableStoreTypesByCategory(category: StoreType | null): string[] {
    if (category === null) return this.getAvailableStoreTypes();
    return [...this.storeTypeMap.keys()]
      .filter((name) => this.storeTypeMap.get(name) === category)
      .sort();
  }
}

export function getAvailableStoreTypes(): string[] {
  return StoreFactory.getInstance().getAvailableStoreTypes();
}

export function getAvailableStoreTypesByCategory(category: StoreType | null): string[] {
  return StoreFactory.getInstance().getAvailableStoreTypesByCategory(category);
}
