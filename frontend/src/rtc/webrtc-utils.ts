import { GO2_LOW_STATE_TYPE } from "@/dashboard/parser/go2-low-state";
import { StoreManager } from "@/dashboard/store/store-manager";

const channelToType = {
    go2_low_state_data_channel: GO2_LOW_STATE_TYPE,
}

const mapChannelToType = (channel: string) => {
    return channelToType[channel as keyof typeof channelToType]
}

/**
 * setup data channel for robot
 */
export function setupDataChannel(
  dataChannel: RTCDataChannel,
  robotId: string
): void {
  const storeManager = StoreManager.getInstance();
  console.log(`DataChannel ${dataChannel.label} 설정 시작, 현재 상태:`, dataChannel.readyState)

  // 기존 onmessage 핸들러 제거
  dataChannel.onmessage = null;

  // 새로운 onmessage 핸들러 설정
  dataChannel.onmessage = (event) => {
    console.log(`DataChannel ${dataChannel.label} 메시지 수신 시작, 데이터 타입:`, typeof event.data)
    try {
      const data = event.data
      
      const channelType = mapChannelToType(dataChannel.label)
      
      const store = storeManager.getStore(robotId, channelType);
      
      if (store) {
        store.add(data);
      } else {
        console.warn(`Store를 찾을 수 없음: ${robotId}, ${String(channelType)}`)
      }
    } catch (error) {
      console.error(`Error processing data for ${dataChannel.label}:`, error);
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
