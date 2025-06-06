import { GO_IMU_TYPE } from "../parser/go2_imu";
import { Go2ImuStore } from "./go2_imu_store";
import { DataStore } from "./store";

export class StoreManager {
  private static instance: StoreManager;
  private stores: Map<string, Map<string, DataStore<any>>> = new Map(); 

  private constructor() {}

  public static getInstance(): StoreManager {
    if (!StoreManager.instance) {
      StoreManager.instance = new StoreManager();
    }
    return StoreManager.instance;
  }

  public initializeRobotStores(robotId: string) {
    const robotStores = new Map<string, DataStore<any>>();
    
    robotStores.set(GO_IMU_TYPE.toString(), new Go2ImuStore(robotId));

    this.stores.set(robotId, robotStores);
  }

  public cleanupRobotStores(robotId: string) {
    this.stores.delete(robotId);
  }

  public getStore<T>(robotId: string, storeType: string): DataStore<T> | undefined {
    return this.stores.get(robotId)?.get(storeType) as DataStore<T>;
  }
}