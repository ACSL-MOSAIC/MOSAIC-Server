import { RobotConnector } from "@/mosaic";
import type { MosaicStore, StoreType } from "@/mosaic/store/interface/mosaic-store.ts";

const storeModules = import.meta.glob<Record<string, unknown>>("../../stores/*/*.ts", {
  eager: true,
});

const EXCLUDED_STORES: string[] = [];

const dummyConnector = new RobotConnector("__dummy__", "__dummy__");

// Map from connector type name → StoreType
const storeTypeMap = new Map<string, StoreType>();

for (const [path, module] of Object.entries(storeModules)) {
  const match = path.match(/\/([^/]+)\/\1\.ts$/);
  if (!match) continue;
  const className = match[1];
  if (EXCLUDED_STORES.includes(className)) continue;

  const StoreClass = module[className] as
    | (new (connector: RobotConnector) => MosaicStore)
    | undefined;
  if (typeof StoreClass !== "function") continue;

  try {
    const instance = new StoreClass(dummyConnector);
    storeTypeMap.set(className, instance.getStoreType());
  } catch {
    // skip stores that cannot be instantiated without additional setup
  }
}

export const availableStoreTypes: string[] = [...storeTypeMap.keys()].sort();

export function getAvailableStoreTypesByCategory(category: StoreType | null): string[] {
  if (category === null) return availableStoreTypes;
  return availableStoreTypes.filter((name) => storeTypeMap.get(name) === category).sort();
}
