import { GO2_LOW_STATE_TYPE } from "../parser/go2-low-state";
import { Go2LowStateStore } from "./go2-low-state.store";
import { DataStore } from "./store";

export class StoreManager {
  private static instance: StoreManager;
  // robotId -> storeType -> store
  private stores: Map<string, Map<symbol, DataStore<any>>> = new Map(); 

  private constructor() {}

  public static getInstance(): StoreManager {
    if (!StoreManager.instance) {
      StoreManager.instance = new StoreManager();
    }
    return StoreManager.instance;
  }

  public initializeRobotStores(robotId: string) {
    const robotStores = new Map<symbol, DataStore<any>>();
    
    robotStores.set(GO2_LOW_STATE_TYPE, new Go2LowStateStore(robotId));

    this.stores.set(robotId, robotStores);
  }

  public cleanupRobotStores(robotId: string) {
    this.stores.delete(robotId);
  }

  public getStore<T>(robotId: string, storeType: symbol): DataStore<T> | undefined {
    return this.stores.get(robotId)?.get(storeType) as DataStore<T>;
  }

  
}