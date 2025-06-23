import { GO2_LOW_STATE_TYPE } from "../parser/go2-low-state";
import { GO2_OUSTER_POINTCLOUD2_TYPE } from "../parser/go2-ouster-pointcloud";
import { TURTLESIM_POSITION_TYPE } from "../parser/turtlesim-position";
import { TURTLESIM_REMOTE_CONTROL_TYPE } from "../parser/turtlesim-remote-control";
import { Go2LowStateStore } from "./go2-low-state.store";
import { Go2OusterPointCloudStore } from "./go2-ouster-pointcloud.store";
import { TurtlesimPositionStore } from "./turtlesim-position.store";
import { TurtlesimRemoteControlStore } from "./turtlesim-remote-control.store";
import { DataStore } from "./store";

export class StoreManager {
  private static instance: StoreManager;
  // robotId -> storeType -> store
  private stores: Map<string, Map<symbol, DataStore<any, any>>> = new Map(); 
  // robotId -> dataType -> channelLabels[] (N:1 관계 추적)
  private dataTypeChannels: Map<string, Map<string, string[]>> = new Map();

  private constructor() {}

  public static getInstance(): StoreManager {
    if (!StoreManager.instance) {
      StoreManager.instance = new StoreManager();
    }
    return StoreManager.instance;
  }

  public initializeRobotStores(robotId: string) {
    // 동적 생성으로 변경: 기본 스토어 생성 제거
    const robotStores = new Map<symbol, DataStore<any, any>>();
    this.stores.set(robotId, robotStores);
    
    // 데이터 타입별 채널 추적 초기화
    this.dataTypeChannels.set(robotId, new Map());
    
    console.log(`로봇 ${robotId} 스토어 컨테이너 초기화 (동적 생성 모드)`);
  }

  public cleanupRobotStores(robotId: string) {
    this.stores.delete(robotId);
    this.dataTypeChannels.delete(robotId);
  }

  public getStore<T, I = string>(robotId: string, storeType: symbol): DataStore<T, I> | undefined {
    return this.stores.get(robotId)?.get(storeType) as DataStore<T, I>;
  }

  // 동적으로 스토어 생성하는 메서드 (주요 메서드)
  public createStoreIfNotExists<T, I = string>(
    robotId: string, 
    storeType: symbol, 
    storeFactory: (robotId: string) => DataStore<T, I>
  ): DataStore<T, I> {
    let robotStores = this.stores.get(robotId);
    
    if (!robotStores) {
      robotStores = new Map<symbol, DataStore<any, any>>();
      this.stores.set(robotId, robotStores);
      console.log(`로봇 ${robotId} 스토어 컨테이너 동적 생성`);
    }
    
    let store = robotStores.get(storeType) as DataStore<T, I>;
    
    if (!store) {
      store = storeFactory(robotId);
      robotStores.set(storeType, store);
      console.log(`동적으로 스토어 생성됨: ${String(storeType)} for robot ${robotId}`);
    }
    
    return store;
  }

  // 채널을 데이터 타입에 등록 (N:1 관계)
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
      console.log(`채널 등록: ${channelLabel} -> ${dataType} for robot ${robotId}`);
    }
  }

  // 특정 데이터 타입을 처리하는 채널들 반환
  public getChannelsForDataType(robotId: string, dataType: string): string[] {
    return this.dataTypeChannels.get(robotId)?.get(dataType) || [];
  }

  // 특정 채널이 처리하는 데이터 타입 반환
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

  // 로봇의 모든 데이터 타입과 채널 관계 반환
  public getRobotChannelMapping(robotId: string): Map<string, string[]> {
    return this.dataTypeChannels.get(robotId) || new Map();
  }
}