import { GO2_LOW_STATE_TYPE } from "@/dashboard/parser/go2-low-state.ts"
import {
  GO2_OUSTER_POINTCLOUD2_TYPE,
  type ParsedPointCloud2,
} from "@/dashboard/parser/go2-ouster-pointcloud.ts"
import { TURTLESIM_POSITION_TYPE } from "@/dashboard/parser/turtlesim-position.ts"
import { TURTLESIM_REMOTE_CONTROL_TYPE } from "@/dashboard/parser/turtlesim-remote-control.ts"
import { VIDEO_RECORDING_TYPE } from "@/dashboard/parser/video-recorder.ts"
import { Go2LowStateStore } from "@/dashboard/store/data-channel-store/readonly/go2-low-state.store.ts"
import { Go2OusterPointCloudStore } from "@/dashboard/store/data-channel-store/readonly/go2-ouster-pointcloud.store.ts"
import { ReadOnlyStoreManager } from "@/dashboard/store/data-channel-store/readonly/read-only-store-manager.ts"
import { TurtlesimPositionStore } from "@/dashboard/store/data-channel-store/readonly/turtlesim-position.store.ts"
import { TurtlesimRemoteControlStore } from "@/dashboard/store/data-channel-store/writeonly/turtlesim-remote-control.store.ts"
import { VideoRecorderStore } from "@/dashboard/store/data-channel-store/writeonly/video-recorder.store.ts"
import { WriteOnlyStoreManager } from "@/dashboard/store/data-channel-store/writeonly/write-only-store-manager.ts"
import type { TurtlesimVideoStore } from "@/dashboard/store/media-channel-store/turtlesim-video.store.ts"
import { VideoStoreManager } from "@/dashboard/store/media-channel-store/video-store-manager.ts"
import { useRobotMapping } from "@/hooks/useRobotMapping"
import { Badge, Box, Text } from "@chakra-ui/react"
import { Go2LowStateWidget } from "./Go2LowStateWidget"
import { Go2OusterPointCloudWidget } from "./Go2OusterPointCloudWidget"
import { TurtlesimPositionWidget } from "./TurtlesimPositionWidget"
import { TurtlesimRemoteControlWidget } from "./TurtlesimRemoteControlWidget"
import { TurtlesimVideoWidget } from "./TurtlesimVideoWidget"
import { VideoRecordingWidget } from "./VideoRecorderWidget"
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

// NO_DATA component
function NoDataWidget({ robotId, type }: { robotId: string; type: string }) {
  const { getRobotName } = useRobotMapping()

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      height="100%"
      bg="gray.50"
      borderRadius="md"
      p={4}
    >
      <Badge colorScheme="gray" mb={2}>
        Not Connected
      </Badge>
      <Text fontSize="sm" color="gray.500" textAlign="center">
        {getRobotName(robotId)}
      </Text>
      <Text fontSize="xs" color="gray.400" textAlign="center">
        {type} Widget
      </Text>
      <Text fontSize="xs" color="gray.400" textAlign="center" mt={2}>
        Data will be displayed when robot is connected
      </Text>
    </Box>
  )
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
  // Check connection status
  const isConnected = connections ? connections[robotId] : false

  // Show NO_DATA if not connected
  if (!isConnected) {
    return <NoDataWidget robotId={robotId} type={type} />
  }

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

    case "go2_ouster_pointcloud": {
      // Dynamic store creation
      const pointCloudStore = readOnlyStoreManager.createStoreIfNotExists<
        ParsedPointCloud2,
        ArrayBuffer
      >(
        robotId,
        GO2_OUSTER_POINTCLOUD2_TYPE,
        (robotId) => new Go2OusterPointCloudStore(robotId),
      )
      return (
        <Go2OusterPointCloudWidget
          robotId={robotId}
          store={pointCloudStore as Go2OusterPointCloudStore}
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

    case "turtlesim_remote_control": {
      // Dynamic store creation
      const remoteControlStore = writeOnlyStoreManager.createStoreIfNotExists(
        robotId,
        TURTLESIM_REMOTE_CONTROL_TYPE,
        (robotId) => new TurtlesimRemoteControlStore(robotId),
      )
      return (
        <TurtlesimRemoteControlWidget
          robotId={robotId}
          store={remoteControlStore as TurtlesimRemoteControlStore}
          dataType={dataType}
          onRemove={onRemove}
        />
      )
    }

    case "turtlesim_video": {
      const videoStore = videoStoreManager.createVideoStoreByMediaTypeAuto(
        robotId,
        "turtlesim_video",
      )
      return (
        <TurtlesimVideoWidget
          robotId={robotId}
          widgetId={robotId}
          store={videoStore as TurtlesimVideoStore}
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
      console.log("Unknown widget type:", type)
      return <div>Unknown widget type: {type}</div>
  }
}
