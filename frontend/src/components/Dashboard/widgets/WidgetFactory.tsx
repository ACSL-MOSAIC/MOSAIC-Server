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
    
    default:
      console.log('Unknown widget type:', type)
      return <div>Unknown widget type: {type}</div>;
  }
} 