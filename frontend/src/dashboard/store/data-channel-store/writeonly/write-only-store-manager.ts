import { DataStore } from "../../store"
import { WriteOnlyStore } from "./write-only-store"
import { BaseStoreManager } from "../../base-store-manager"

export class WriteOnlyStoreManager implements BaseStoreManager {
  private static instance: WriteOnlyStoreManager;
  // robotId -> storeType -> store
  private stores: Map<string, Map<symbol, WriteOnlyStore<any, any>>> = new Map(); 
  // robotId -> dataType -> channelLabels[] (N:1 관계 추적)
  private dataTypeChannels: Map<string, Map<string, string[]>> = new Map();
  // 연결 상태 모니터링 콜백들
  private connectionStateCallbacks: Map<string, ((robotId: string, storeType: string, connected: boolean, state: string) => void)[]> = new Map();

  private constructor() {}

  public static getInstance(): WriteOnlyStoreManager {
    if (!WriteOnlyStoreManager.instance) {
      WriteOnlyStoreManager.instance = new WriteOnlyStoreManager();
    }
    return WriteOnlyStoreManager.instance;
  }

  public initializeRobotStores(robotId: string) {
    const robotStores = new Map<symbol, WriteOnlyStore<any, any>>();
    this.stores.set(robotId, robotStores);
    
    // 데이터 타입별 채널 추적 초기화
    this.dataTypeChannels.set(robotId, new Map());
    
    console.log(`로봇 ${robotId} 쓰기 전용 스토어 컨테이너 초기화`);
  }

  public cleanupRobotStores(robotId: string) {
    const robotStores = this.stores.get(robotId);
    if (robotStores) {
      // 모든 쓰기 전용 스토어의 데이터 채널 정리
      robotStores.forEach(store => {
        store.cleanupDataChannel();
      });
    }
    
    this.stores.delete(robotId);
    this.dataTypeChannels.delete(robotId);
    console.log(`로봇 ${robotId} 쓰기 전용 스토어 정리 완료`);
  }

  public getStore<T, I = string>(robotId: string, storeType: symbol): WriteOnlyStore<T, I> | undefined {
    return this.stores.get(robotId)?.get(storeType) as WriteOnlyStore<T, I>;
  }

  public createStoreIfNotExists<T, I = string>(
    robotId: string, 
    storeType: symbol, 
    storeFactory: (robotId: string) => WriteOnlyStore<T, I>
  ): WriteOnlyStore<T, I> {
    let robotStores = this.stores.get(robotId);
    
    if (!robotStores) {
      robotStores = new Map<symbol, WriteOnlyStore<any, any>>();
      this.stores.set(robotId, robotStores);
      console.log(`로봇 ${robotId} 쓰기 전용 스토어 컨테이너 동적 생성`);
    }
    
    let store = robotStores.get(storeType) as WriteOnlyStore<T, I>;
    
    if (!store) {
      store = storeFactory(robotId);
      robotStores.set(storeType, store);
      
      // 연결 상태 변경 리스너 등록
      this.setupStoreConnectionListener(robotId, storeType, store);
      
      console.log(`쓰기 전용 스토어 생성됨: ${String(storeType)} for robot ${robotId}`);
    }
    
    return store;
  }

  // 스토어 연결 상태 리스너 설정
  private setupStoreConnectionListener(robotId: string, storeType: symbol, store: WriteOnlyStore<any, any>): void {
    store.onConnectionStateChange((connected, state) => {
      console.log(`WriteOnlyStoreManager: ${robotId}의 ${String(storeType)} 연결 상태 변경:`, { connected, state });
      
      // 등록된 콜백들에 알림
      const callbacks = this.connectionStateCallbacks.get(robotId) || [];
      callbacks.forEach(callback => {
        try {
          callback(robotId, String(storeType), connected, state);
        } catch (error) {
          console.error('연결 상태 콜백 실행 중 에러:', error);
        }
      });
    });
  }

  // 연결 상태 변경 콜백 등록
  public onConnectionStateChange(robotId: string, callback: (robotId: string, storeType: string, connected: boolean, state: string) => void): () => void {
    let callbacks = this.connectionStateCallbacks.get(robotId);
    if (!callbacks) {
      callbacks = [];
      this.connectionStateCallbacks.set(robotId, callbacks);
    }
    
    callbacks.push(callback);
    
    // 현재 상태 즉시 알림
    const robotStores = this.stores.get(robotId);
    if (robotStores) {
      robotStores.forEach((store, storeType) => {
        const state = store.getChannelState();
        callback(robotId, String(storeType), state.connected, state.state);
      });
    }
    
    // 콜백 제거 함수 반환
    return () => {
      const callbacks = this.connectionStateCallbacks.get(robotId);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
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
      console.log(`쓰기 전용 채널 등록: ${channelLabel} -> ${dataType} for robot ${robotId}`);
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

  // 쓰기 전용 스토어 전용 메서드들
  public getWriteOnlyStores(robotId: string): Map<symbol, WriteOnlyStore<any, any>> {
    return this.stores.get(robotId) || new Map();
  }

  public getConnectedWriteOnlyStores(robotId: string): WriteOnlyStore<any, any>[] {
    const robotStores = this.stores.get(robotId);
    if (!robotStores) return [];
    
    return Array.from(robotStores.values()).filter(store => store.isChannelConnected());
  }

  // 쓰기 전용 스토어는 항상 데이터 채널이 필요하므로 강제로 생성
  public ensureWriteOnlyStoreExists<T, I = string>(
    robotId: string,
    storeType: symbol,
    storeFactory: (robotId: string) => WriteOnlyStore<T, I>
  ): WriteOnlyStore<T, I> {
    let store = this.getStore<T, I>(robotId, storeType);
    
    if (!store) {
      store = this.createStoreIfNotExists(robotId, storeType, storeFactory);
      console.log(`쓰기 전용 스토어 강제 생성: ${String(storeType)} for robot ${robotId}`);
    }
    
    return store;
  }

  // 모든 쓰기 전용 스토어의 연결 상태 확인
  public getWriteOnlyStoresStatus(robotId: string): { [storeType: string]: boolean } {
    const robotStores = this.stores.get(robotId);
    if (!robotStores) return {};
    
    const status: { [storeType: string]: boolean } = {};
    robotStores.forEach((store, storeType) => {
      status[String(storeType)] = store.isChannelConnected();
    });
    
    return status;
  }

  // 모든 쓰기 전용 스토어의 상세 상태 정보 반환
  public getWriteOnlyStoresDetailedStatus(robotId: string): {
    [storeType: string]: {
      connected: boolean
      state: string
      label?: string
      bufferedAmount: number
      protocol?: string
    }
  } {
    const robotStores = this.stores.get(robotId);
    if (!robotStores) return {};
    
    const status: { [storeType: string]: any } = {};
    robotStores.forEach((store, storeType) => {
      status[String(storeType)] = store.getChannelState();
    });
    
    return status;
  }

  // 특정 로봇의 모든 스토어 연결 상태 요약
  public getRobotConnectionSummary(robotId: string): {
    totalStores: number
    connectedStores: number
    disconnectedStores: number
    connectionRate: number
    stores: { [storeType: string]: { connected: boolean; state: string } }
  } {
    const robotStores = this.stores.get(robotId);
    if (!robotStores) {
      return {
        totalStores: 0,
        connectedStores: 0,
        disconnectedStores: 0,
        connectionRate: 0,
        stores: {}
      };
    }
    
    const stores: { [storeType: string]: { connected: boolean; state: string } } = {};
    let connectedCount = 0;
    
    robotStores.forEach((store, storeType) => {
      const state = store.getChannelState();
      stores[String(storeType)] = {
        connected: state.connected,
        state: state.state
      };
      
      if (state.connected) {
        connectedCount++;
      }
    });
    
    const totalStores = robotStores.size;
    const disconnectedStores = totalStores - connectedCount;
    const connectionRate = totalStores > 0 ? (connectedCount / totalStores) * 100 : 0;
    
    return {
      totalStores,
      connectedStores: connectedCount,
      disconnectedStores,
      connectionRate,
      stores
    };
  }

  // 모든 로봇의 연결 상태 요약
  public getAllRobotsConnectionSummary(): {
    [robotId: string]: {
      totalStores: number
      connectedStores: number
      disconnectedStores: number
      connectionRate: number
    }
  } {
    const summary: { [robotId: string]: any } = {};
    
    for (const robotId of this.stores.keys()) {
      summary[robotId] = this.getRobotConnectionSummary(robotId);
    }
    
    return summary;
  }
} 