import {GO2_LOW_STATE_TYPE} from "@/dashboard/parser/go2-low-state"
import {LIDAR_POINTCLOUD2_TYPE} from "@/dashboard/parser/lidar-pointcloud.ts"
import {REMOTE_CONTROL_PAD_TYPE} from "@/dashboard/parser/remote-control-pad.ts"
import {TURTLESIM_POSITION_TYPE} from "@/dashboard/parser/turtlesim-position"
import {VIDEO_RECORDING_TYPE} from "@/dashboard/parser/video-recorder.ts"
import {GPS_COORDINATE_TYPE} from "@/dashboard/parser/gps-coordinate.ts"
import {ROS_2D_POSE_TYPE} from "@/dashboard/parser/ros2-d-pose-with-covariance.ts"

// Store factory mapping by data type
export const DATA_CHANNEL_CONFIG = {
  turtlesim_position: {
    type: "turtlesim_position",
    channelType: "readonly" as const,
    defaultLabel: "position_data_channel",
    description: "Turtlesim Position Data Channel",
  },
  go2_low_state: {
    type: "go2_low_state",
    channelType: "readonly" as const,
    defaultLabel: "go2_low_state_data_channel",
    description: "Go2 Robot State Data Channel",
  },
  lidar_pointcloud_1: {
    type: "lidar_pointcloud",
    channelType: "readonly" as const,
    defaultLabel: "lidar_pointcloud_1",
    description: "LiDAR Point Cloud Data Channel 1",
  },
  lidar_pointcloud_2: {
    type: "lidar_pointcloud",
    channelType: "readonly" as const,
    defaultLabel: "lidar_pointcloud_2",
    description: "LiDAR Point Cloud Data Channel 2",
  },
  lidar_pointcloud_3: {
    type: "lidar_pointcloud",
    channelType: "readonly" as const,
    defaultLabel: "lidar_pointcloud_3",
    description: "LiDAR Point Cloud Data Channel 3",
  },
  lidar_pointcloud_4: {
    type: "lidar_pointcloud",
    channelType: "readonly" as const,
    defaultLabel: "lidar_pointcloud_4",
    description: "LiDAR Point Cloud Data Channel 4",
  },
  lidar_pointcloud_5: {
    type: "lidar_pointcloud",
    channelType: "readonly" as const,
    defaultLabel: "lidar_pointcloud_5",
    description: "LiDAR Point Cloud Data Channel 5",
  },
  remote_control_pad: {
    type: "remote_control_pad",
    channelType: "writeonly" as const,
    defaultLabel: "remote_control_pad_channel",
    description: "Turtlesim Remote Control Command Data Channel",
  },
  video_recorder: {
    type: "video_recorder",
    channelType: "writeonly" as const,
    defaultLabel: "video_recorder_channel",
    description: "Video Recorder Command Data Channel",
  },
  osm_gps_map: {
    type: "osm_gps_map",
    channelType: "readonly" as const,
    defaultLabel: "gps_coordinate_channel",
    description: "GPS Coordinate Data Channel",
  },
  ros_2d_map_pose: {
    type: "ros_2d_map_pose",
    channelType: "readonly" as const,
    defaultLabel: "2d_map_pose_channel",
    description: "2D Map Pose Data Channel",
  },
} as const

// Default data channel configuration
export const DEFAULT_DATA_CHANNELS = [
  {
    label: DATA_CHANNEL_CONFIG.turtlesim_position.defaultLabel,
    dataType: DATA_CHANNEL_CONFIG.turtlesim_position.type,
    channelType: DATA_CHANNEL_CONFIG.turtlesim_position.channelType,
    options: undefined,
  },
  {
    label: DATA_CHANNEL_CONFIG.go2_low_state.defaultLabel,
    dataType: DATA_CHANNEL_CONFIG.go2_low_state.type,
    channelType: DATA_CHANNEL_CONFIG.go2_low_state.channelType,
    options: undefined,
  },
  {
    label: DATA_CHANNEL_CONFIG.lidar_pointcloud_1.defaultLabel,
    dataType: DATA_CHANNEL_CONFIG.lidar_pointcloud_1.type,
    channelType: DATA_CHANNEL_CONFIG.lidar_pointcloud_1.channelType,
    options: undefined,
  },
  {
    label: DATA_CHANNEL_CONFIG.lidar_pointcloud_2.defaultLabel,
    dataType: DATA_CHANNEL_CONFIG.lidar_pointcloud_2.type,
    channelType: DATA_CHANNEL_CONFIG.lidar_pointcloud_2.channelType,
    options: undefined,
  },
  {
    label: DATA_CHANNEL_CONFIG.lidar_pointcloud_3.defaultLabel,
    dataType: DATA_CHANNEL_CONFIG.lidar_pointcloud_3.type,
    channelType: DATA_CHANNEL_CONFIG.lidar_pointcloud_3.channelType,
    options: undefined,
  },
  {
    label: DATA_CHANNEL_CONFIG.lidar_pointcloud_4.defaultLabel,
    dataType: DATA_CHANNEL_CONFIG.lidar_pointcloud_4.type,
    channelType: DATA_CHANNEL_CONFIG.lidar_pointcloud_4.channelType,
    options: undefined,
  },
  {
    label: DATA_CHANNEL_CONFIG.lidar_pointcloud_5.defaultLabel,
    dataType: DATA_CHANNEL_CONFIG.lidar_pointcloud_5.type,
    channelType: DATA_CHANNEL_CONFIG.lidar_pointcloud_5.channelType,
    options: undefined,
  },
  {
    label: DATA_CHANNEL_CONFIG.remote_control_pad.defaultLabel,
    dataType: DATA_CHANNEL_CONFIG.remote_control_pad.type,
    channelType: DATA_CHANNEL_CONFIG.remote_control_pad.channelType,
    options: undefined,
  },
  {
    label: DATA_CHANNEL_CONFIG.video_recorder.defaultLabel,
    dataType: DATA_CHANNEL_CONFIG.video_recorder.type,
    channelType: DATA_CHANNEL_CONFIG.video_recorder.channelType,
    options: undefined,
  },
  {
    label: DATA_CHANNEL_CONFIG.osm_gps_map.defaultLabel,
    dataType: DATA_CHANNEL_CONFIG.osm_gps_map.type,
    channelType: DATA_CHANNEL_CONFIG.osm_gps_map.channelType,
    options: undefined,
  },
  {
    label: DATA_CHANNEL_CONFIG.ros_2d_map_pose.defaultLabel,
    dataType: DATA_CHANNEL_CONFIG.ros_2d_map_pose.type,
    channelType: DATA_CHANNEL_CONFIG.ros_2d_map_pose.channelType,
    options: undefined,
  },
] as const

// Symbol mapping by data type
export const DATA_TYPE_SYMBOLS = {
  turtlesim_position: TURTLESIM_POSITION_TYPE,
  go2_low_state: GO2_LOW_STATE_TYPE,
  lidar_pointcloud: LIDAR_POINTCLOUD2_TYPE,
  remote_control_pad: REMOTE_CONTROL_PAD_TYPE,
  video_recorder: VIDEO_RECORDING_TYPE,
  osm_gps_map: GPS_COORDINATE_TYPE,
  ros_2d_map_pose: ROS_2D_POSE_TYPE,
} as const

// Utility functions
export const DataChannelConfigUtils = {
  /**
   * Check if the data type is supported
   */
  isSupportedDataType(
    dataType: string,
  ): dataType is keyof typeof DATA_CHANNEL_CONFIG {
    return dataType in DATA_TYPE_SYMBOLS
  },

  /**
   * Return the channel direction (readonly/writeonly) for the data type
   */
  getChannelDirection(dataType: string): "readonly" | "writeonly" | null {
    const config =
      DATA_CHANNEL_CONFIG[dataType as keyof typeof DATA_CHANNEL_CONFIG]
    return config?.channelType || null
  },

  /**
   * Return the default channel label for the data type
   */
  getDefaultChannelLabel(dataType: string): string | null {
    const config =
      DATA_CHANNEL_CONFIG[dataType as keyof typeof DATA_CHANNEL_CONFIG]
    return config?.defaultLabel || null
  },

  /**
   * Return the store symbol for the data type
   */
  getStoreSymbol(dataType: string): symbol | null {
    return DATA_TYPE_SYMBOLS[dataType as keyof typeof DATA_TYPE_SYMBOLS] || null
  },

  /**
   * Return the readonly data types (unique store types only)
   */
  getReadOnlyDataTypes(): string[] {
    const dataTypes = Array.from(
      new Set(
        Object.entries(DATA_CHANNEL_CONFIG)
          .filter(([_, config]) => config.channelType === "readonly")
          .map(([_, config]) => config.type),
      ),
    )

    console.log("readonly data types:", dataTypes)
    return dataTypes
  },

  /**
   * Return the writeonly data types
   */
  getWriteOnlyDataTypes(): string[] {
    return Array.from(
      new Set(
        Object.entries(DATA_CHANNEL_CONFIG)
          .filter(([_, config]) => config.channelType === "writeonly")
          .map(([_, config]) => config.type),
      ),
    )
  },
}

// Type definitions
export type DataType = keyof typeof DATA_CHANNEL_CONFIG
export type ChannelType = "readonly" | "writeonly"
export type DataChannelConfigItem = (typeof DEFAULT_DATA_CHANNELS)[number]
