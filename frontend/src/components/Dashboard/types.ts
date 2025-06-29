export type WidgetType = 'go2_low_state' | 'go2_ouster_pointcloud' | 'turtlesim_position' | 'turtlesim_remote_control' | 'turtlesim_video';

export interface WidgetPosition {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface WidgetConfig {
  id: string;
  type: WidgetType;
  position: WidgetPosition;
  robotId: string;
  dataType: string;
}

export interface DashboardTab {
  id: string;
  name: string;
  widgets: WidgetConfig[];
}

export interface DashboardConfig {
  userId: string;
  tabs: DashboardTab[];
  activeTabId: string;
}

// 로컬스토리지 키 상수
export const DASHBOARD_STORAGE_KEY = 'dashboard_config'; 