const storeModules = import.meta.glob<Record<string, unknown>>("../../stores/*/*.ts", {
  eager: true,
});

const EXCLUDED_STORES = ["MediaStreamStore"];

export const availableStoreTypes: string[] = Object.keys(storeModules)
  .map((path) => path.match(/\/([^/]+)\/\1\.ts$/)?.[1])
  .filter((name): name is string => !!name && !EXCLUDED_STORES.includes(name))
  .sort();