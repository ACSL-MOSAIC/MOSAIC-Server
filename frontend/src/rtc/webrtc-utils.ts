import { ReadOnlyStoreManager } from "@/dashboard/store/data-channel-store/readonly/read-only-store-manager";
import { WriteOnlyStoreManager } from "@/dashboard/store/data-channel-store/writeonly/write-only-store-manager";
import { TurtlesimPositionStore } from "@/dashboard/store/data-channel-store/readonly/turtlesim-position.store";
import { Go2LowStateStore } from "@/dashboard/store/data-channel-store/readonly/go2-low-state.store";
import { Go2OusterPointCloudStore } from "@/dashboard/store/data-channel-store/readonly/go2-ouster-pointcloud.store";
import { TurtlesimRemoteControlStore } from "@/dashboard/store/data-channel-store/writeonly/turtlesim-remote-control.store";
import { DataStore } from "@/dashboard/store/store";
import { ReadOnlyStore } from "@/dashboard/store/data-channel-store/readonly/read-only-store";
import { WriteOnlyStore } from "@/dashboard/store/data-channel-store/writeonly/write-only-store";
import { DataChannelConfigUtils } from "./config/webrtc-datachannel-config";

/**
 * Setup data channel for robot
 * Creates and configures data stores based on channel type and data type
 */
export function createDataChannel(
  dataChannel: RTCDataChannel,
  robotId: string,
  dataType: string,
  channelType: 'readonly' | 'writeonly'
): void {
  const readOnlyStoreManager = ReadOnlyStoreManager.getInstance();
  const writeOnlyStoreManager = WriteOnlyStoreManager.getInstance();
  
  console.log(`DataChannel ${dataChannel.label} setup started, current state:`, dataChannel.readyState, 'dataType:', dataType, 'channelType:', channelType)

  // Check if data type is supported (including base types for pointcloud)
  if (!DataChannelConfigUtils.isSupportedDataType(dataType)) {
    console.warn(`Unsupported data type: ${dataType}`)
    return
  }

  // Register channel for data type (N:1 relationship)
  switch (channelType) {
    case 'writeonly':
      writeOnlyStoreManager.registerChannelForDataType(robotId, dataType, dataChannel.label)
      break
    case 'readonly':
      readOnlyStoreManager.registerChannelForDataType(robotId, dataType, dataChannel.label)
      break
  }

  // Create Store and setup DataChannel
  const channelTypeSymbol = DataChannelConfigUtils.getStoreSymbol(dataType)
  
  if (!channelTypeSymbol) {
    console.warn(`Unknown data type: ${dataType} for channel ${dataChannel.label}`)
    return
  }
  
  let store: DataStore<any, any> | undefined;
  
  switch (channelType) {
    case 'readonly':
      switch (dataType as any) {
        case 'turtlesim_position':
          store = readOnlyStoreManager.createStoreIfNotExists(
            robotId, 
            channelTypeSymbol, 
            (robotId) => new TurtlesimPositionStore(robotId)
          );
          break;
        case 'go2_low_state':
          store = readOnlyStoreManager.createStoreIfNotExists(
            robotId, 
            channelTypeSymbol, 
            (robotId) => new Go2LowStateStore(robotId)
          );
          break;
        case 'go2_ouster_pointcloud':
          store = readOnlyStoreManager.createStoreIfNotExists(
            robotId, 
            channelTypeSymbol, 
            (robotId) => new Go2OusterPointCloudStore(robotId)
          );
          break;
        default:
          console.warn(`Unsupported data type for readonly: ${dataType}`);
          return;
      }
      break;
      
    case 'writeonly':
      switch (dataType) {
        case 'turtlesim_remote_control':
          store = writeOnlyStoreManager.createStoreIfNotExists(
            robotId, 
            channelTypeSymbol, 
            (robotId) => new TurtlesimRemoteControlStore(robotId)
          );
          break;
        default:
          console.warn(`Unsupported data type for writeonly: ${dataType}`);
          return;
      }
      break;
  }

  // Setup DataChannel for Store
  if (store) {
    if (store instanceof ReadOnlyStore) {
      // ReadOnlyStore는 다중 채널 지원
      store.addDataChannel(dataChannel);
      console.log(`Data channel setup completed for ${store.constructor.name}:`, {
        robotId,
        channelLabel: dataChannel.label,
        channelState: dataChannel.readyState
      });
    } else if (store instanceof WriteOnlyStore) {
      // WriteOnlyStore는 기존 방식 유지
      store.setDataChannel(dataChannel);
      console.log(`Data channel setup completed for ${store.constructor.name}:`, {
        robotId,
        channelLabel: dataChannel.label,
        channelState: dataChannel.readyState
      });
    }
  } else {
    console.warn(`Store creation failed: ${robotId}, ${String(channelTypeSymbol)}`)
    return
  }

  // Setup new onmessage handler (data processing only)
  dataChannel.onmessage = (event) => {
    try {
      const data = event.data
      
      if (store) {
        store.add(data);
      }
    } catch (error) {
      console.error(`Error processing data for ${dataChannel.label} (${dataType}):`, error);
      console.error('Error details:', error instanceof Error ? error.stack : error)
    }
  };
}

/**
 * Clean up all data channels for robot
 * Removes all stores and channels associated with the robot
 */
export function cleanupAllDataChannels(robotId: string): void {
  const readOnlyStoreManager = ReadOnlyStoreManager.getInstance();
  const writeOnlyStoreManager = WriteOnlyStoreManager.getInstance();
  
  readOnlyStoreManager.cleanupRobotStores(robotId);
  writeOnlyStoreManager.cleanupRobotStores(robotId);
}
