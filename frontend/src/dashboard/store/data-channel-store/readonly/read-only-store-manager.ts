import { DataStore } from "../../store"
import { ReadOnlyStore } from "./read-only-store"
import { BaseStoreManager } from "../../base-store-manager"

export class ReadOnlyStoreManager implements BaseStoreManager {
  private static instance: ReadOnlyStoreManager;
  // robotId -> storeType -> store
  private stores: Map<string, Map<symbol, ReadOnlyStore<any, any>>> = new Map(); 
  // robotId -> dataType -> channelLabels[] (N:1 관계 추적)
  private dataTypeChannels: Map<string, Map<string, string[]>> = new Map();

  private constructor() {}

  public static getInstance(): ReadOnlyStoreManager {
    if (!ReadOnlyStoreManager.instance) {
      ReadOnlyStoreManager.instance = new ReadOnlyStoreManager();
    }
    return ReadOnlyStoreManager.instance;
  }

  public initializeRobotStores(robotId: string) {
    const robotStores = new Map<symbol, ReadOnlyStore<any, any>>();
    this.stores.set(robotId, robotStores);
    
    // 데이터 타입별 채널 추적 초기화
    this.dataTypeChannels.set(robotId, new Map());
    
    console.log(`로봇 ${robotId} 읽기 전용 스토어 컨테이너 초기화`);
  }

  public cleanupRobotStores(robotId: string) {
    const robotStores = this.stores.get(robotId);
    if (robotStores) {
      // 모든 읽기 전용 스토어의 데이터 채널 정리
      robotStores.forEach(store => {
        store.cleanupDataChannel();
      });
    }
    
    this.stores.delete(robotId);
    this.dataTypeChannels.delete(robotId);
    console.log(`로봇 ${robotId} 읽기 전용 스토어 정리 완료`);
  }

  public getStore<T, I = string>(robotId: string, storeType: symbol): ReadOnlyStore<T, I> | undefined {
    return this.stores.get(robotId)?.get(storeType) as ReadOnlyStore<T, I>;
  }

  public createStoreIfNotExists<T, I = string>(
    robotId: string, 
    storeType: symbol, 
    storeFactory: (robotId: string) => ReadOnlyStore<T, I>
  ): ReadOnlyStore<T, I> {
    let robotStores = this.stores.get(robotId);
    
    if (!robotStores) {
      robotStores = new Map<symbol, ReadOnlyStore<any, any>>();
      this.stores.set(robotId, robotStores);
      console.log(`로봇 ${robotId} 읽기 전용 스토어 컨테이너 동적 생성`);
    }
    
    let store = robotStores.get(storeType) as ReadOnlyStore<T, I>;
    
    if (!store) {
      store = storeFactory(robotId);
      robotStores.set(storeType, store);
      console.log(`읽기 전용 스토어 생성됨: ${String(storeType)} for robot ${robotId}`);
    }
    
    return store;
  }

  public registerChannelForDataType(robotId: string, dataType: string, channelLabel: string) {
    let robotDataTypeChannels = this.dataTypeChannels.get(robotId);
    
    if (!robotDataTypeChannels) {
      robotDataTypeChannels = new Map<string, string[]>();
      this.dataTypeChannels.set(robotId, robotDataTypeChannels);
    }
    
    let channels = robotDataTypeChannels.get(dataType);
    if (!channels) {
      channels = [];
      robotDataTypeChannels.set(dataType, channels);
    }
    
    if (!channels.includes(channelLabel)) {
      channels.push(channelLabel);
      console.log(`읽기 전용 채널 등록: ${channelLabel} -> ${dataType} for robot ${robotId}`);
    }
  }

  public getChannelsForDataType(robotId: string, dataType: string): string[] {
    return this.dataTypeChannels.get(robotId)?.get(dataType) || [];
  }

  public getDataTypeForChannel(robotId: string, channelLabel: string): string | undefined {
    const robotDataTypeChannels = this.dataTypeChannels.get(robotId);
    if (!robotDataTypeChannels) return undefined;
    
    for (const [dataType, channels] of robotDataTypeChannels.entries()) {
      if (channels.includes(channelLabel)) {
        return dataType;
      }
    }
    return undefined;
  }

  public getRobotChannelMapping(robotId: string): Map<string, string[]> {
    return this.dataTypeChannels.get(robotId) || new Map();
  }

  // 읽기 전용 스토어 전용 메서드들
  public getReadOnlyStores(robotId: string): Map<symbol, ReadOnlyStore<any, any>> {
    return this.stores.get(robotId) || new Map();
  }

  public getConnectedReadOnlyStores(robotId: string): ReadOnlyStore<any, any>[] {
    const robotStores = this.stores.get(robotId);
    if (!robotStores) return [];
    
    return Array.from(robotStores.values()).filter(store => store.isChannelConnected());
  }
} 