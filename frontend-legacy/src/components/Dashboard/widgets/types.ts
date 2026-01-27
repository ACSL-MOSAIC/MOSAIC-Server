import type {
  VideoObjectDetectionWidgetConfig
} from "@/components/Dashboard/widgets/video-object-detection/VideoObjectDetectionWidget.tsx"
import type {UniversalWidgetConfig} from "@/components/Dashboard/widgets/dynamic/universal-widget-config.ts"
import type {OsmGpsMapWidgetConfig} from "@/components/Dashboard/widgets/osm-gps-map/OsmGpsMapWidget.tsx"
import type {Ros2DMapPoseWidgetConfig} from "@/components/Dashboard/widgets/ros-2d-map-pose/Ros2DMapPoseWidget.tsx"

export interface WidgetProps {
  robotId?: string
  dataType: string
  onRemove?: () => void
}

export type WidgetConfigs =
  | UniversalWidgetConfig
  | VideoObjectDetectionWidgetConfig
  | OsmGpsMapWidgetConfig
  | Ros2DMapPoseWidgetConfig
