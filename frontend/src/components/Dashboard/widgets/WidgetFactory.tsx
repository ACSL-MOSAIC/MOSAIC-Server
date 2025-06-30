import React from 'react'
import { Box, Text, Badge, Flex } from '@chakra-ui/react'
import { WidgetProps } from './types'
import { Go2LowStateWidget } from './Go2LowStateWidget'
import { Go2LowStateStore } from '../../../dashboard/store/data-channel-store/readonly/go2-low-state.store'
import { ReadOnlyStoreManager } from '../../../dashboard/store/data-channel-store/readonly/read-only-store-manager'
import { WriteOnlyStoreManager } from '../../../dashboard/store/data-channel-store/writeonly/write-only-store-manager'
import { GO2_LOW_STATE_TYPE } from '../../../dashboard/parser/go2-low-state'
import { Go2OusterPointCloudWidget } from './Go2OusterPointCloudWidget'
import { Go2OusterPointCloudStore } from '../../../dashboard/store/data-channel-store/readonly/go2-ouster-pointcloud.store'
import { GO2_OUSTER_POINTCLOUD2_TYPE, ParsedPointCloud2 } from '../../../dashboard/parser/go2-ouster-pointcloud'
import { TurtlesimPositionWidget } from './TurtlesimPositionWidget'
import { TurtlesimPositionStore } from '../../../dashboard/store/data-channel-store/readonly/turtlesim-position.store'
import { TURTLESIM_POSITION_TYPE } from '../../../dashboard/parser/turtlesim-position'
import { TurtlesimRemoteControlWidget } from './TurtlesimRemoteControlWidget'
import { TurtlesimRemoteControlStore } from '../../../dashboard/store/data-channel-store/writeonly/turtlesim-remote-control.store'
import { TURTLESIM_REMOTE_CONTROL_TYPE } from '../../../dashboard/parser/turtlesim-remote-control'
import { TurtlesimVideoWidget } from './TurtlesimVideoWidget'
import { TurtlesimVideoStore } from '../../../dashboard/store/media-channel-store/turtlesim-video.store'
import { VideoStoreManager } from '../../../dashboard/store/media-channel-store/video-store-manager'
import { MediaChannelConfigUtils } from "../../../rtc/webrtc-media-channel-config"
import { TURTLESIM_VIDEO_TYPE } from '../../../dashboard/parser/turtlesim-video'
import { useWebSocket } from '@/contexts/WebSocketContext'
import { useRobotMapping } from '@/hooks/useRobotMapping'

export interface WidgetFactoryProps extends WidgetProps {
  type: string;
  connections?: { [key: string]: boolean };
}

// NO_DATA 컴포넌트
function NoDataWidget({ robotId, type }: { robotId: string; type: string }) {
  const { getRobotName } = useRobotMapping();

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
        연결 없음
      </Badge>
      <Text fontSize="sm" color="gray.500" textAlign="center">
        {getRobotName(robotId)}
      </Text>
      <Text fontSize="xs" color="gray.400" textAlign="center">
        {type} 위젯
      </Text>
      <Text fontSize="xs" color="gray.400" textAlign="center" mt={2}>
        로봇을 연결하면 데이터가 표시됩니다
      </Text>
    </Box>
  )
}

export function WidgetFactory({ type, robotId, dataType, connections }: WidgetFactoryProps) {
  console.log('WidgetFactory 렌더링', { type, robotId, dataType, connections })
  
  // 연결 상태 확인
  const isConnected = connections ? connections[robotId] : false
  
  // 연결되지 않은 경우 NO_DATA 표시
  if (!isConnected) {
    return <NoDataWidget robotId={robotId} type={type} />
  }
  
  const readOnlyStoreManager = ReadOnlyStoreManager.getInstance();
  const writeOnlyStoreManager = WriteOnlyStoreManager.getInstance();
  const videoStoreManager = VideoStoreManager.getInstance()

  switch (type) {
    case 'go2_low_state':
      // 동적 스토어 생성
      const lowStateStore = readOnlyStoreManager.createStoreIfNotExists(
        robotId,
        GO2_LOW_STATE_TYPE,
        (robotId) => new Go2LowStateStore(robotId)
      );
      return <Go2LowStateWidget robotId={robotId} store={lowStateStore as Go2LowStateStore} dataType={dataType} />;
    
    case 'go2_ouster_pointcloud':
      // 동적 스토어 생성
      const pointCloudStore = readOnlyStoreManager.createStoreIfNotExists<ParsedPointCloud2, ArrayBuffer>(
        robotId,
        GO2_OUSTER_POINTCLOUD2_TYPE,
        (robotId) => new Go2OusterPointCloudStore(robotId)
      );
      return <Go2OusterPointCloudWidget robotId={robotId} store={pointCloudStore as Go2OusterPointCloudStore} dataType={dataType} />;
    
    case 'turtlesim_position':
      // 동적 스토어 생성
      const positionStore = readOnlyStoreManager.createStoreIfNotExists(
        robotId,
        TURTLESIM_POSITION_TYPE,
        (robotId) => new TurtlesimPositionStore(robotId)
      );
      return <TurtlesimPositionWidget robotId={robotId} store={positionStore as TurtlesimPositionStore} dataType={dataType} />;
    
    case 'turtlesim_remote_control':
      // 동적 스토어 생성
      const remoteControlStore = writeOnlyStoreManager.createStoreIfNotExists(
        robotId,
        TURTLESIM_REMOTE_CONTROL_TYPE,
        (robotId) => new TurtlesimRemoteControlStore(robotId)
      );
      return <TurtlesimRemoteControlWidget robotId={robotId} store={remoteControlStore as TurtlesimRemoteControlStore} dataType={dataType} />;
    
    case 'turtlesim_video':
      const videoStore = videoStoreManager.createVideoStoreByMediaTypeAuto(
        robotId,
        'turtlesim_video'
      );
      return <TurtlesimVideoWidget robotId={robotId} widgetId={robotId} store={videoStore as TurtlesimVideoStore} dataType={dataType} />;
    
    default:
      console.log('Unknown widget type:', type)
      return <div>Unknown widget type: {type}</div>;
  }
} 