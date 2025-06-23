import { DashboardConfig, DashboardTab, WidgetConfig, DASHBOARD_STORAGE_KEY } from './types';
import { v4 as uuidv4 } from 'uuid';

// 로봇 ID 배열을 정렬된 문자열로 변환 (순서 무관하게 비교)
const normalizeRobotIds = (robotIds: string[]): string => {
  return robotIds.sort().join(',');
};

// 로봇 ID 집합이 동일한지 확인
const areRobotSetsEqual = (robotIds1: string[], robotIds2: string[]): boolean => {
  if (robotIds1.length !== robotIds2.length) return false;
  
  const sorted1 = robotIds1.sort();
  const sorted2 = robotIds2.sort();
  
  return sorted1.every((id, index) => id === sorted2[index]);
};

// 로봇 조합별 고유 키 생성
const getStorageKey = (robotIds: string[]): string => {
  const normalizedIds = normalizeRobotIds(robotIds);
  return `${DASHBOARD_STORAGE_KEY}_${normalizedIds}`;
};

// 로컬스토리지에서 대시보드 설정 로드
export const loadDashboardConfig = (robotIdList: string[]): DashboardConfig => {
  try {
    const storageKey = getStorageKey(robotIdList);
    const stored = localStorage.getItem(storageKey);
    
    if (stored) {
      const config: DashboardConfig = JSON.parse(stored);
      return config;
    }
  } catch (error) {
    console.error('대시보드 설정 로드 실패:', error);
  }
  
  // 기본 설정 생성
  return createDefaultDashboardConfig(robotIdList);
};

// 기본 대시보드 설정 생성
export const createDefaultDashboardConfig = (robotIdList: string[]): DashboardConfig => {
  const defaultTab: DashboardTab = {
    id: uuidv4(),
    name: '메인 대시보드',
    widgets: []
  };

  return {
    robotId: normalizeRobotIds(robotIdList),
    tabs: [defaultTab],
    activeTabId: defaultTab.id
  };
};

// 로컬스토리지에 대시보드 설정 저장
export const saveDashboardConfig = (config: DashboardConfig): void => {
  try {
    const robotIds = config.robotId.split(',').filter(id => id.trim());
    const storageKey = getStorageKey(robotIds);
    
    const normalizedConfig = {
      ...config,
      robotId: normalizeRobotIds(robotIds)
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