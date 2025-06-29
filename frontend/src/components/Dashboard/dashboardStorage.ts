import { DashboardConfig, DashboardTab, WidgetConfig, DASHBOARD_STORAGE_KEY } from './types';
import { v4 as uuidv4 } from 'uuid';

// 사용자별 고유 키 생성
const getStorageKey = (userId: string): string => {
  return `${DASHBOARD_STORAGE_KEY}_${userId}`;
};

// 로컬스토리지에서 대시보드 설정 로드
export const loadDashboardConfig = (userId: string): DashboardConfig => {
  try {
    const storageKey = getStorageKey(userId);
    const stored = localStorage.getItem(storageKey);
    
    if (stored) {
      const config: DashboardConfig = JSON.parse(stored);
      return config;
    }
  } catch (error) {
    console.error('대시보드 설정 로드 실패:', error);
  }
  
  // 기본 설정 생성
  return createDefaultDashboardConfig();
};

// 기본 대시보드 설정 생성
export const createDefaultDashboardConfig = (): DashboardConfig => {
  const defaultTab: DashboardTab = {
    id: uuidv4(),
    name: '메인 대시보드',
    widgets: []
  };

  return {
    userId: '',
    tabs: [defaultTab],
    activeTabId: defaultTab.id
  };
};

// 로컬스토리지에 대시보드 설정 저장
export const saveDashboardConfig = (config: DashboardConfig, userId: string): void => {
  try {
    const storageKey = getStorageKey(userId);
    
    const normalizedConfig = {
      ...config,
      userId
    };
    
    localStorage.setItem(storageKey, JSON.stringify(normalizedConfig));
  } catch (error) {
    console.error('대시보드 설정 저장 실패:', error);
  }
};

// 새 탭 추가
export const addTab = (config: DashboardConfig, tabName: string): DashboardConfig => {
  const newTab: DashboardTab = {
    id: uuidv4(),
    name: tabName,
    widgets: []
  };

  return {
    ...config,
    tabs: [...config.tabs, newTab],
    activeTabId: newTab.id
  };
};

// 탭 삭제
export const removeTab = (config: DashboardConfig, tabId: string): DashboardConfig => {
  const filteredTabs = config.tabs.filter(tab => tab.id !== tabId);
  
  if (filteredTabs.length === 0) {
    // 모든 탭이 삭제된 경우 기본 탭 생성
    const defaultTab: DashboardTab = {
      id: uuidv4(),
      name: '메인 대시보드',
      widgets: []
    };
    return {
      ...config,
      tabs: [defaultTab],
      activeTabId: defaultTab.id
    };
  }

  // 활성 탭이 삭제된 경우 첫 번째 탭을 활성으로 설정
  const newActiveTabId = config.activeTabId === tabId ? filteredTabs[0].id : config.activeTabId;

  return {
    ...config,
    tabs: filteredTabs,
    activeTabId: newActiveTabId
  };
};

// 탭 이름 변경
export const renameTab = (config: DashboardConfig, tabId: string, newName: string): DashboardConfig => {
  return {
    ...config,
    tabs: config.tabs.map(tab => 
      tab.id === tabId ? { ...tab, name: newName } : tab
    )
  };
};

// 위젯 추가
export const addWidget = (config: DashboardConfig, tabId: string, widget: WidgetConfig): DashboardConfig => {
  return {
    ...config,
    tabs: config.tabs.map(tab => 
      tab.id === tabId 
        ? { ...tab, widgets: [...tab.widgets, widget] }
        : tab
    )
  };
};

// 위젯 제거
export const removeWidget = (config: DashboardConfig, tabId: string, widgetId: string): DashboardConfig => {
  return {
    ...config,
    tabs: config.tabs.map(tab => 
      tab.id === tabId 
        ? { ...tab, widgets: tab.widgets.filter(widget => widget.id !== widgetId) }
        : tab
    )
  };
};

// 특정 로봇의 모든 위젯 제거 (로봇 연결 해제 시 사용)
export const removeWidgetsByRobotId = (config: DashboardConfig, robotId: string): DashboardConfig => {
  return {
    ...config,
    tabs: config.tabs.map(tab => ({
      ...tab,
      widgets: tab.widgets.filter(widget => widget.robotId !== robotId)
    }))
  };
};

// 위젯 위치 업데이트
export const updateWidgetPosition = (
  config: DashboardConfig, 
  tabId: string, 
  widgetId: string, 
  position: { x: number; y: number; w: number; h: number }
): DashboardConfig => {
  return {
    ...config,
    tabs: config.tabs.map(tab => 
      tab.id === tabId 
        ? { 
            ...tab, 
            widgets: tab.widgets.map(widget => 
              widget.id === widgetId 
                ? { ...widget, position }
                : widget
            )
          }
        : tab
    )
  };
}; 