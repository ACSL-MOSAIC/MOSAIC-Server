import type {VideoObjectDetectionWidgetConfig} from "@/components/Dashboard/widgets/VideoObjectDetectionWidget.tsx"
import type {UniversalWidgetConfig} from "@/components/Dashboard/widgets/dynamic/universal-widget-config.ts"
import type {OsmGpsMapWidgetConfig} from "@/components/Dashboard/widgets/OsmGpsMapWidget.tsx"

export interface WidgetProps {
  robotId?: string
  dataType: string
  onRemove?: () => void
}

export type WidgetConfigs =
  | UniversalWidgetConfig
  | VideoObjectDetectionWidgetConfig
  | OsmGpsMapWidgetConfig
