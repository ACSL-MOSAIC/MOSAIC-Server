import { WidgetFrame } from "@/components/Dashboard/widgets/WidgetFrame.tsx"
import { GO2_LOW_STATE_TYPE } from "@/dashboard/parser/go2-low-state.ts"
import {
  LIDAR_POINTCLOUD2_TYPE,
  type ParsedPointCloud2,
} from "@/dashboard/parser/lidar-pointcloud.ts"
import { REMOTE_CONTROL_PAD_TYPE } from "@/dashboard/parser/remote-control-pad.ts"
import { TURTLESIM_POSITION_TYPE } from "@/dashboard/parser/turtlesim-position.ts"
import { VIDEO_RECORDING_TYPE } from "@/dashboard/parser/video-recorder.ts"
import { Go2LowStateStore } from "@/dashboard/store/data-channel-store/readonly/go2-low-state.store.ts"
import { LidarPointCloudStore } from "@/dashboard/store/data-channel-store/readonly/lidar-point-cloud.store.ts"
import { ReadOnlyStoreManager } from "@/dashboard/store/data-channel-store/readonly/read-only-store-manager.ts"
import { TurtlesimPositionStore } from "@/dashboard/store/data-channel-store/readonly/turtlesim-position.store.ts"
import { RemoteControlPadStore } from "@/dashboard/store/data-channel-store/writeonly/remote-control-pad.store.ts"
import { VideoRecorderStore } from "@/dashboard/store/data-channel-store/writeonly/video-recorder.store.ts"
import { WriteOnlyStoreManager } from "@/dashboard/store/data-channel-store/writeonly/write-only-store-manager.ts"
import { VideoStoreManager } from "@/dashboard/store/media-channel-store/video-store-manager.ts"
import type { VideoStore } from "@/dashboard/store/media-channel-store/video-store.ts"
import { Go2LowStateWidget } from "./Go2LowStateWidget"
import { LiDARPointCloud22DWidget } from "./LiDARPointCloud22DWidget.tsx"
import { RemoteControlPadWidget } from "./RemoteControlPadWidget.tsx"
import { TurtlesimPositionWidget } from "./TurtlesimPositionWidget"
import { VideoRecordingWidget } from "./VideoRecorderWidget"
import { VideoStreamWidget } from "./VideoStreamWidget.tsx"
import { UniversalWidget } from "./dynamic/UniversalWidget"
import type { UniversalWidgetConfig } from "./dynamic/universal-widget-config"
import type { WidgetProps } from "./types"

export interface WidgetFactoryProps extends WidgetProps {
  type: string
  connections?: { [key: string]: boolean }
  config?: UniversalWidgetConfig // 범용 위젯 설정
  widgetId?: string
  onRemove?: () => void
  onUpdateConfig?: (newConfig: UniversalWidgetConfig) => void
}

export function WidgetFactory({
  type,
  robotId,
  dataType,
  connections,
  config,
  widgetId,
  onRemove,
  onUpdateConfig,
}: WidgetFactoryProps) {
  const readOnlyStoreManager = ReadOnlyStoreManager.getInstance()
  const writeOnlyStoreManager = WriteOnlyStoreManager.getInstance()
  const videoStoreManager = VideoStoreManager.getInstance()

  switch (type) {
    case "go2_low_state": {
      // Dynamic store creation
      const lowStateStore = readOnlyStoreManager.createStoreIfNotExists(
        robotId,
        GO2_LOW_STATE_TYPE,
        (robotId) => new Go2LowStateStore(robotId),
      )
      return (
        <Go2LowStateWidget
          robotId={robotId}
          store={lowStateStore as Go2LowStateStore}
          dataType={dataType}
          onRemove={onRemove}
        />
      )
    }

    case "lidar_pointcloud": {
      // Dynamic store creation
      const pointCloudStore = readOnlyStoreManager.createStoreIfNotExists<
        ParsedPointCloud2,
        ArrayBuffer
      >(
        robotId,
        LIDAR_POINTCLOUD2_TYPE,
        (robotId) => new LidarPointCloudStore(robotId),
      )
      return (
        <LiDARPointCloud22DWidget
          robotId={robotId}
          store={pointCloudStore as LidarPointCloudStore}
          dataType={dataType}
          onRemove={onRemove}
        />
      )
    }

    case "turtlesim_position": {
      // Dynamic store creation
      const positionStore = readOnlyStoreManager.createStoreIfNotExists(
        robotId,
        TURTLESIM_POSITION_TYPE,
        (robotId) => new TurtlesimPositionStore(robotId),
      )
      return (
        <TurtlesimPositionWidget
          robotId={robotId}
          store={positionStore as TurtlesimPositionStore}
          dataType={dataType}
          onRemove={onRemove}
        />
      )
    }

    case "remote_control_pad": {
      // Dynamic store creation
      const remoteControlStore = writeOnlyStoreManager.createStoreIfNotExists(
        robotId,
        REMOTE_CONTROL_PAD_TYPE,
        (robotId) => new RemoteControlPadStore(robotId),
      )
      return (
        <RemoteControlPadWidget
          robotId={robotId}
          store={remoteControlStore as RemoteControlPadStore}
          dataType={dataType}
          onRemove={onRemove}
        />
      )
    }

    case "video_stream": {
      const videoStore = videoStoreManager.createVideoStoreByMediaTypeAuto(
        robotId,
        "video_stream",
      )
      return (
        <VideoStreamWidget
          robotId={robotId}
          store={videoStore as VideoStore}
          dataType={dataType}
          onRemove={onRemove}
        />
      )
    }

    case "video_stream_v2": {
      const videoStore = videoStoreManager.createVideoStoreByMediaTypeAuto(
        robotId,
        "video_stream_v2",
      )
      return (
        <VideoStreamWidget
          robotId={robotId}
          store={videoStore as VideoStore}
          dataType={dataType}
          onRemove={onRemove}
        />
      )
    }

    case "universal": {
      if (!config) {
        console.error("Universal widget requires config")
        return <div>Universal widget requires config</div>
      }
      return (
        <UniversalWidget
          robotId={robotId}
          config={config}
          connections={connections}
          onUpdateConfig={onUpdateConfig}
          onRemove={onRemove}
          widgetId={widgetId}
        />
      )
    }

    case "video_recorder": {
      const videoRecorderStore = writeOnlyStoreManager.createStoreIfNotExists(
        robotId,
        VIDEO_RECORDING_TYPE,
        (robotId) => new VideoRecorderStore(robotId),
      )
      return (
        <VideoRecordingWidget
          robotId={robotId}
          store={videoRecorderStore as VideoRecorderStore}
          dataType={dataType}
          onRemove={onRemove}
        />
      )
    }

    default:
      return (
        <WidgetFrame
          title={`Unknown: ${type}`}
          robot_id={robotId}
          isConnected={false}
          onRemove={onRemove}
        />
      )
  }
}
