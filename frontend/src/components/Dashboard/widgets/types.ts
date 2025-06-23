import { ParsedGo2LowState } from "@/dashboard/parser/go2-low-state"

export interface WidgetProps {
  robotId: string;
  dataType: string;
}

export type WidgetType = 'go2_low_state' | 'go2_ouster_pointcloud' | 'turtlesim_position' | 'turtlesim_remote_control';
