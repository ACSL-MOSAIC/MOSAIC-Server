export type WidgetType =
  | "go2_low_state"
  | "go2_ouster_pointcloud"
  | "turtlesim_position"
  | "turtlesim_remote_control"
  | "turtlesim_video"
  | "universal"

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
  robotId: string
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
