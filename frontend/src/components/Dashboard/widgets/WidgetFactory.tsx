import React from 'react'
import { WidgetProps } from './types'
import { Go2LowStateWidget } from './Go2LowStateWidget'
import { Go2LowStateStore } from '../../../dashboard/store/go2-low-state.store'
import { StoreManager } from '../../../dashboard/store/store-manager'
import { GO2_LOW_STATE_TYPE } from '../../../dashboard/parser/go2-low-state'
import { Go2OusterPointCloudWidget } from './Go2OusterPointCloudWidget'
import { Go2OusterPointCloudStore } from '../../../dashboard/store/go2-ouster-pointcloud.store'
import { GO2_OUSTER_POINTCLOUD2_TYPE, ParsedPointCloud2 } from '../../../dashboard/parser/go2-ouster-pointcloud'
import { TurtlesimPositionWidget } from './TurtlesimPositionWidget'
import { TurtlesimPositionStore } from '../../../dashboard/store/turtlesim-position.store'
import { TURTLESIM_POSITION_TYPE } from '../../../dashboard/parser/turtlesim-position'
import { TurtlesimRemoteControlWidget } from './TurtlesimRemoteControlWidget'
import { TurtlesimRemoteControlStore } from '../../../dashboard/store/turtlesim-remote-control.store'
import { TURTLESIM_REMOTE_CONTROL_TYPE } from '../../../dashboard/parser/turtlesim-remote-control'
import { TurtlesimVideoWidget } from './TurtlesimVideoWidget'
import { TURTLESIM_VIDEO_TYPE } from '../../../dashboard/parser/turtlesim-video'
import { TurtlesimVideoStore } from '../../../dashboard/store/turtlesim-video.store'
import { VideoStoreManager } from '../../../dashboard/store/video-store-manager'

export interface WidgetFactoryProps extends WidgetProps {
  type: string;
}

export function WidgetFactory({ type, robotId, dataType }: WidgetFactoryProps) {
  console.log('WidgetFactory 렌더링', { type, robotId, dataType })
  
  const storeManager = StoreManager.getInstance();
  
  switch (type) {
    case 'go2_low_state':
      // 동적 스토어 생성
      const lowStateStore = storeManager.createStoreIfNotExists(
        robotId,
        GO2_LOW_STATE_TYPE,
        (robotId) => new Go2LowStateStore(robotId)
      );
      return <Go2LowStateWidget robotId={robotId} store={lowStateStore as Go2LowStateStore} dataType={dataType} />;
    
    case 'go2_ouster_pointcloud':
      // 동적 스토어 생성
      const pointCloudStore = storeManager.createStoreIfNotExists<ParsedPointCloud2, ArrayBuffer>(
        robotId,
        GO2_OUSTER_POINTCLOUD2_TYPE,
        (robotId) => new Go2OusterPointCloudStore(robotId)
      );
      return <Go2OusterPointCloudWidget robotId={robotId} store={pointCloudStore as Go2OusterPointCloudStore} dataType={dataType} />;
    
    case 'turtlesim_position':
      // 동적 스토어 생성
      const positionStore = storeManager.createStoreIfNotExists(
        robotId,
        TURTLESIM_POSITION_TYPE,
        (robotId) => new TurtlesimPositionStore(robotId)
      );
      return <TurtlesimPositionWidget robotId={robotId} store={positionStore as TurtlesimPositionStore} dataType={dataType} />;
    
    case 'turtlesim_remote_control':
      // 동적 스토어 생성
      const remoteControlStore = storeManager.createStoreIfNotExists(
        robotId,
        TURTLESIM_REMOTE_CONTROL_TYPE,
        (robotId) => new TurtlesimRemoteControlStore(robotId)
      );
      return <TurtlesimRemoteControlWidget robotId={robotId} store={remoteControlStore as TurtlesimRemoteControlStore} dataType={dataType} />;
    
    case 'turtlesim_video':
      // VideoStoreManager에서 기존 스토어 가져오기
      const videoStoreManager = VideoStoreManager.getInstance()
      let videoStore = videoStoreManager.getVideoStore(robotId, 'turtlesim_video_track')
      
      if (!videoStore) {
        // 스토어가 없으면 생성
        videoStore = videoStoreManager.createVideoStoreIfNotExists(
          robotId,
          'turtlesim_video_track',
          'turtlesim_video'
        )
        console.log('터틀비디오 스토어 새로 생성됨:', videoStore)
      } else {
        console.log('터틀비디오 스토어 기존 것 사용:', videoStore)
      }
      
      console.log('터틀비디오 위젯 렌더링:', { robotId, widgetId: robotId, store: videoStore })
      return <TurtlesimVideoWidget robotId={robotId} widgetId={robotId} store={videoStore} />;
    
    default:
      console.log('Unknown widget type:', type)
      return <div>Unknown widget type: {type}</div>;
  }
} 