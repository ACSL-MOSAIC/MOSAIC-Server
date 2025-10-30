export type WidgetType =
  | "go2_low_state"
  | "lidar_pointcloud"
  | "turtlesim_position"
  | "remote_control_pad"
  | "video_stream"
  | "video_stream_v2"
  | "video_object_detection"
  | "video_segmentation"
  | "universal"
  | "video_recorder"
  | "osm_gps_map"
  | "ros_2d_map_pose"

export interface WidgetPosition {
  x: number
  y: number
  w: number
  h: number
}

export interface WidgetConfig {
  id: string
  type: WidgetType
  position: WidgetPosition
  robotId?: string
  dataType: string
  config?: any // Universal widget config
}

export interface DashboardTab {
  id: string
  name: string
  widgets: WidgetConfig[]
}

export interface DashboardConfig {
  userId: string
  tabs: DashboardTab[]
  activeTabId: string
}

// Local storage key constant
export const DASHBOARD_STORAGE_KEY = "dashboard_config"
