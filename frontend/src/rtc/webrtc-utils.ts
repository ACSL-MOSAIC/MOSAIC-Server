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

  // setup event handler for data channel
  dataChannel.onmessage = (event) => {
    try {
      const store = storeManager.getStore(robotId, mapChannelToType(dataChannel.label));
      
      if (store) {
        store.add(event.data);
      }
    } catch (error) {
      console.error(`Error processing data for ${dataChannel.label}:`, error);
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
