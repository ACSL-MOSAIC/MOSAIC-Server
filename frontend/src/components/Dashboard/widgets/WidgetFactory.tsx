import React from 'react'
import { WidgetProps } from './types'
import { Go2LowStateWidget } from './Go2LowStateWidget'
import { Go2LowStateStore } from '../../../dashboard/store/go2-low-state.store'
import { StoreManager } from '../../../dashboard/store/store-manager'
import { GO2_LOW_STATE_TYPE } from '../../../dashboard/parser/go2-low-state'
import { Go2OusterPointCloudWidget } from './Go2OusterPointCloudWidget'
import { Go2OusterPointCloudStore } from '../../../dashboard/store/go2-ouster-pointcloud.store'
import { GO2_OUSTER_POINTCLOUD2_TYPE, ParsedPointCloud2 } from '../../../dashboard/parser/go2-ouster-pointcloud'

export interface WidgetFactoryProps extends WidgetProps {
  type: string;
}

export function WidgetFactory({ type, robotId, dataType }: WidgetFactoryProps) {
  console.log('WidgetFactory 렌더링', { type, robotId, dataType })
  switch (type) {
    case 'go2_low_state':
      const store = StoreManager.getInstance().getStore(robotId, GO2_LOW_STATE_TYPE);
      console.log('store 반환값:', store)
      if (!store) {
        console.log('store가 없어서 initializeRobotStores 호출')
        StoreManager.getInstance().initializeRobotStores(robotId);
        return <div>Loading store...</div>;
      }
      console.log('Go2LowStateWidget 렌더링 시도', { robotId, store, dataType })
      return <Go2LowStateWidget robotId={robotId} store={store as Go2LowStateStore} dataType={dataType} />;
    
    
    case 'go2_ouster_pointcloud':
      const pointCloudStore = StoreManager.getInstance().getStore<ParsedPointCloud2, ArrayBuffer>(robotId, GO2_OUSTER_POINTCLOUD2_TYPE);
      if (!pointCloudStore) {
        StoreManager.getInstance().initializeRobotStores(robotId);
        return <div>Loading point cloud store...</div>;
      }
      return <Go2OusterPointCloudWidget robotId={robotId} store={pointCloudStore as Go2OusterPointCloudStore} dataType={dataType} />;
    default:
      console.log('Unknown widget type:', type)
      return <div>Unknown widget type: {type}</div>;
  }
} 