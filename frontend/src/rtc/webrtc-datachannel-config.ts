import { GO2_LOW_STATE_TYPE } from "@/dashboard/parser/go2-low-state"
import { GO2_OUSTER_POINTCLOUD2_TYPE } from "@/dashboard/parser/go2-ouster-pointcloud"
import { TURTLESIM_POSITION_TYPE } from "@/dashboard/parser/turtlesim-position"
import { TURTLESIM_REMOTE_CONTROL_TYPE } from "@/dashboard/parser/turtlesim-remote-control"

// Store factory mapping by data type
export const DATA_CHANNEL_CONFIG = {
  'turtlesim_position': {
    type: 'turtlesim_position',
    channelType: 'readonly' as const,
    defaultLabel: 'position_data_channel',
    description: 'Turtlesim Position Data Channel'
  },
  'go2_low_state': {
    type: 'go2_low_state',
    channelType: 'readonly' as const,
    defaultLabel: 'go2_low_state_data_channel',
    description: 'Go2 Robot State Data Channel'
  },
  'go2_ouster_pointcloud_1': {
    type: 'go2_ouster_pointcloud',
    channelType: 'readonly' as const,
    defaultLabel: 'go2_ouster_pointcloud_1',
    description: 'Go2 Ouster Point Cloud Data Channel 1'
  },
  'go2_ouster_pointcloud_2': {
    type: 'go2_ouster_pointcloud',
    channelType: 'readonly' as const,
    defaultLabel: 'go2_ouster_pointcloud_2',
    description: 'Go2 Ouster Point Cloud Data Channel 2'
  },
  'go2_ouster_pointcloud_3': {
    type: 'go2_ouster_pointcloud',
    channelType: 'readonly' as const,
    defaultLabel: 'go2_ouster_pointcloud_3',
    description: 'Go2 Ouster Point Cloud Data Channel 3'
  },
  'go2_ouster_pointcloud_4': {
    type: 'go2_ouster_pointcloud',
    channelType: 'readonly' as const,
    defaultLabel: 'go2_ouster_pointcloud_4',
    description: 'Go2 Ouster Point Cloud Data Channel 4'
  },
  'go2_ouster_pointcloud_5': {
    type: 'go2_ouster_pointcloud',
    channelType: 'readonly' as const,
    defaultLabel: 'go2_ouster_pointcloud_5',
    description: 'Go2 Ouster Point Cloud Data Channel 5'
  },
  'turtlesim_remote_control': {
    type: 'turtlesim_remote_control',
    channelType: 'writeonly' as const,
    defaultLabel: 'remote_control_channel',
    description: 'Turtlesim Remote Control Command Data Channel'
  }
} as const

// Default data channel configuration
export const DEFAULT_DATA_CHANNELS = [
  {
    label: DATA_CHANNEL_CONFIG.turtlesim_position.defaultLabel,
    dataType: DATA_CHANNEL_CONFIG.turtlesim_position.type,
    channelType: DATA_CHANNEL_CONFIG.turtlesim_position.channelType,
    options: undefined
  },
  {
    label: DATA_CHANNEL_CONFIG.go2_low_state.defaultLabel,
    dataType: DATA_CHANNEL_CONFIG.go2_low_state.type,
    channelType: DATA_CHANNEL_CONFIG.go2_low_state.channelType,
    options: undefined
  },
  {
    label: DATA_CHANNEL_CONFIG.go2_ouster_pointcloud_1.defaultLabel,
    dataType: DATA_CHANNEL_CONFIG.go2_ouster_pointcloud_1.type,
    channelType: DATA_CHANNEL_CONFIG.go2_ouster_pointcloud_1.channelType,
    options: undefined
  },
  {
    label: DATA_CHANNEL_CONFIG.go2_ouster_pointcloud_2.defaultLabel,
    dataType: DATA_CHANNEL_CONFIG.go2_ouster_pointcloud_2.type,
    channelType: DATA_CHANNEL_CONFIG.go2_ouster_pointcloud_2.channelType,
    options: undefined
  },
  {
    label: DATA_CHANNEL_CONFIG.go2_ouster_pointcloud_3.defaultLabel,
    dataType: DATA_CHANNEL_CONFIG.go2_ouster_pointcloud_3.type,
    channelType: DATA_CHANNEL_CONFIG.go2_ouster_pointcloud_3.channelType,
    options: undefined
  },
  {
    label: DATA_CHANNEL_CONFIG.go2_ouster_pointcloud_4.defaultLabel,
    dataType: DATA_CHANNEL_CONFIG.go2_ouster_pointcloud_4.type,
    channelType: DATA_CHANNEL_CONFIG.go2_ouster_pointcloud_4.channelType,
    options: undefined
  },
  {
    label: DATA_CHANNEL_CONFIG.go2_ouster_pointcloud_5.defaultLabel,
    dataType: DATA_CHANNEL_CONFIG.go2_ouster_pointcloud_5.type,
    channelType: DATA_CHANNEL_CONFIG.go2_ouster_pointcloud_5.channelType,
    options: undefined
  },
  {
    label: DATA_CHANNEL_CONFIG.turtlesim_remote_control.defaultLabel,
    dataType: DATA_CHANNEL_CONFIG.turtlesim_remote_control.type,
    channelType: DATA_CHANNEL_CONFIG.turtlesim_remote_control.channelType,
    options: undefined
  }
] as const

// Symbol mapping by data type
export const DATA_TYPE_SYMBOLS = {
  'turtlesim_position': TURTLESIM_POSITION_TYPE,
  'go2_low_state': GO2_LOW_STATE_TYPE,
  'go2_ouster_pointcloud': GO2_OUSTER_POINTCLOUD2_TYPE,
  'turtlesim_remote_control': TURTLESIM_REMOTE_CONTROL_TYPE
} as const

// Utility functions
export const DataChannelConfigUtils = {
  /**
   * Check if the data type is supported
   */
  isSupportedDataType(dataType: string): dataType is keyof typeof DATA_CHANNEL_CONFIG {
    return dataType in DATA_CHANNEL_CONFIG
  },

  /**
   * Return the channel direction (readonly/writeonly) for the data type
   */
  getChannelDirection(dataType: string): 'readonly' | 'writeonly' | null {
    const config = DATA_CHANNEL_CONFIG[dataType as keyof typeof DATA_CHANNEL_CONFIG]
    return config?.channelType || null
  },

  /**
   * Return the default channel label for the data type
   */
  getDefaultChannelLabel(dataType: string): string | null {
    const config = DATA_CHANNEL_CONFIG[dataType as keyof typeof DATA_CHANNEL_CONFIG]
    return config?.defaultLabel || null
  },

  /**
   * Return the store symbol for the data type
   */
  getStoreSymbol(dataType: string): symbol | null {
    return DATA_TYPE_SYMBOLS[dataType as keyof typeof DATA_TYPE_SYMBOLS] || null
  },

  /**
   * Return the readonly data types
   */
  getReadOnlyDataTypes(): string[] {
    return Object.entries(DATA_CHANNEL_CONFIG)
      .filter(([_, config]) => config.channelType === 'readonly')
      .map(([dataType, _]) => dataType)
  },

  /**
   * Return the writeonly data types
   */
  getWriteOnlyDataTypes(): string[] {
    return Object.entries(DATA_CHANNEL_CONFIG)
      .filter(([_, config]) => config.channelType === 'writeonly')
      .map(([dataType, _]) => dataType)
  }
}

// Type definitions
export type DataType = keyof typeof DATA_CHANNEL_CONFIG
export type ChannelType = 'readonly' | 'writeonly'
export type DataChannelConfigItem = typeof DEFAULT_DATA_CHANNELS[number] 