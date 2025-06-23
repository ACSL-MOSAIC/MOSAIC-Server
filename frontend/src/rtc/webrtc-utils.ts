import { GO2_LOW_STATE_TYPE } from "@/dashboard/parser/go2-low-state";
import { GO2_OUSTER_POINTCLOUD2_TYPE } from "@/dashboard/parser/go2-ouster-pointcloud";
import { TURTLESIM_POSITION_TYPE } from "@/dashboard/parser/turtlesim-position";
import { StoreManager } from "@/dashboard/store/store-manager";
import { TurtlesimPositionStore } from "@/dashboard/store/turtlesim-position.store";
import { Go2LowStateStore } from "@/dashboard/store/go2-low-state.store";
import { Go2OusterPointCloudStore } from "@/dashboard/store/go2-ouster-pointcloud.store";
import { DataStore } from "@/dashboard/store/store";

const dataTypeToSymbol = {
  'turtlesim_position': TURTLESIM_POSITION_TYPE,
  'go2_low_state': GO2_LOW_STATE_TYPE,
  'go2_ouster_pointcloud': GO2_OUSTER_POINTCLOUD2_TYPE,
}

const getDataTypeSymbol = (dataType: string) => {
  return dataTypeToSymbol[dataType as keyof typeof dataTypeToSymbol]
}

/**
 * setup data channel for robot
 */
export function setupDataChannel(
  dataChannel: RTCDataChannel,
  robotId: string,
  dataType: string
): void {
  const storeManager = StoreManager.getInstance();
  console.log(`DataChannel ${dataChannel.label} 설정 시작, 현재 상태:`, dataChannel.readyState, '데이터타입:', dataType)

  // 채널을 데이터 타입에 등록 (N:1 관계)
  storeManager.registerChannelForDataType(robotId, dataType, dataChannel.label)

  // 기존 onmessage 핸들러 제거
  dataChannel.onmessage = null;

  // 새로운 onmessage 핸들러 설정
  dataChannel.onmessage = (event) => {
    try {
      const data = event.data
      
      const channelType = getDataTypeSymbol(dataType)
      
      if (!channelType) {
        console.warn(`알 수 없는 데이터 타입: ${dataType} for channel ${dataChannel.label}`)
        return
      }
      
      // 데이터 타입별로 동적 스토어 생성
      let store: DataStore<any, any>;
      
      switch (dataType) {
        case 'turtlesim_position':
          store = storeManager.createStoreIfNotExists(
            robotId, 
            channelType, 
            (robotId) => new TurtlesimPositionStore(robotId)
          );
          break;
        case 'go2_low_state':
          store = storeManager.createStoreIfNotExists(
            robotId, 
            channelType, 
            (robotId) => new Go2LowStateStore(robotId)
          );
          break;
        case 'go2_ouster_pointcloud':
          store = storeManager.createStoreIfNotExists(
            robotId, 
            channelType, 
            (robotId) => new Go2OusterPointCloudStore(robotId)
          );
          break;
        default:
          console.warn(`지원하지 않는 데이터 타입: ${dataType}`);
          return;
      }
      
      if (store) {
        store.add(data);
        console.log(`데이터 처리 완료: ${dataChannel.label} -> ${dataType}`)
      } else {
        console.warn(`스토어 생성 실패: ${robotId}, ${String(channelType)}`)
      }
    } catch (error) {
      console.error(`Error processing data for ${dataChannel.label} (${dataType}):`, error);
      console.error('Error details:', error instanceof Error ? error.stack : error)
    }
  };
}

/**
 * cleanup all data channels for robot
 */
export function cleanupAllDataChannels(robotId: string): void {
  const storeManager = StoreManager.getInstance();
  storeManager.cleanupRobotStores(robotId);
}
