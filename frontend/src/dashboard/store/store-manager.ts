import { GO2_LOW_STATE_TYPE } from "../parser/go2-low-state";
import { GO2_OUSTER_POINTCLOUD2_TYPE } from "../parser/go2-ouster-pointcloud";
import { Go2LowStateStore } from "./go2-low-state.store";
import { Go2OusterPointCloudStore } from "./go2-ouster-pointcloud.store";
import { DataStore } from "./store";

export class StoreManager {
  private static instance: StoreManager;
  // robotId -> storeType -> store
  private stores: Map<string, Map<symbol, DataStore<any, any>>> = new Map(); 

  private constructor() {}

  public static getInstance(): StoreManager {
    if (!StoreManager.instance) {
      StoreManager.instance = new StoreManager();
    }
    return StoreManager.instance;
  }

  public initializeRobotStores(robotId: string) {
    const robotStores = new Map<symbol, DataStore<any, any>>();
    
    robotStores.set(GO2_LOW_STATE_TYPE, new Go2LowStateStore(robotId));
    robotStores.set(GO2_OUSTER_POINTCLOUD2_TYPE, new Go2OusterPointCloudStore(robotId));

    this.stores.set(robotId, robotStores);
  }

  public cleanupRobotStores(robotId: string) {
    this.stores.delete(robotId);
  }

  public getStore<T, I = string>(robotId: string, storeType: symbol): DataStore<T, I> | undefined {
    return this.stores.get(robotId)?.get(storeType) as DataStore<T, I>;
  }

  
}