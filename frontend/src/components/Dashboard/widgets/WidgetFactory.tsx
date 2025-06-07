import React from 'react'
import { WidgetProps } from './types'
import { Go2LowStateWidget } from './Go2LowStateWidget'
import { Go2LowStateStore } from '../../../dashboard/store/go2-low-state.store'
import { StoreManager } from '../../../dashboard/store/store-manager'
import { GO2_LOW_STATE_TYPE } from '../../../dashboard/parser/go2-low-state'

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
    default:
      console.log('Unknown widget type:', type)
      return <div>Unknown widget type: {type}</div>;
  }
} 