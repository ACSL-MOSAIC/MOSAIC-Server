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
  switch (type) {
    case 'go2_low_state':
      const store = StoreManager.getInstance().getStore(robotId, GO2_LOW_STATE_TYPE);
      if (!store) {
        StoreManager.getInstance().initializeRobotStores(robotId);
        return <div>Loading store...</div>;
      }
      return <Go2LowStateWidget robotId={robotId} store={store as Go2LowStateStore} dataType={dataType} />;
    default:
      return <div>Unknown widget type: {type}</div>;
  }
} 