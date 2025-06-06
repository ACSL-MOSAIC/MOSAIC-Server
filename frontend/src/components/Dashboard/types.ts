export type WidgetType = 'go2_low_state';

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

export interface DashboardConfig {
  robotId: string;
  widgets: WidgetConfig[];
} 