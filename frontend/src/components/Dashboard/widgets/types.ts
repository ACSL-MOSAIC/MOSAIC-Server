export interface WidgetProps {
  robotId: string
  dataType: string
  onRemove?: () => void
}

export type WidgetType =
  | "go2_low_state"
  | "go2_ouster_pointcloud"
  | "turtlesim_position"
  | "turtlesim_remote_control"
  | "universal"
  | "video_recorder"
