import { v4 as uuidv4 } from "uuid"
import type { DashboardConfig, DashboardTab, WidgetConfig } from "./types"

// Add new tab
export const addTab = (
  config: DashboardConfig,
  tabName: string,
): DashboardConfig => {
  const newTab: DashboardTab = {
    id: uuidv4(),
    name: tabName,
    widgets: [],
  }

  return {
    ...config,
    tabs: [...config.tabs, newTab],
    activeTabId: newTab.id,
  }
}

// Remove tab
export const removeTab = (
  config: DashboardConfig,
  tabId: string,
): DashboardConfig => {
  const filteredTabs = config.tabs.filter((tab) => tab.id !== tabId)

  if (filteredTabs.length === 0) {
    // Create default tab if all tabs are removed
    const defaultTab: DashboardTab = {
      id: uuidv4(),
      name: "Main Dashboard",
      widgets: [],
    }
    return {
      ...config,
      tabs: [defaultTab],
      activeTabId: defaultTab.id,
    }
  }

  // Set first tab as active if active tab is removed
  const newActiveTabId =
    config.activeTabId === tabId ? filteredTabs[0].id : config.activeTabId

  return {
    ...config,
    tabs: filteredTabs,
    activeTabId: newActiveTabId,
  }
}

// Rename tab
export const renameTab = (
  config: DashboardConfig,
  tabId: string,
  newName: string,
): DashboardConfig => {
  return {
    ...config,
    tabs: config.tabs.map((tab) =>
      tab.id === tabId ? { ...tab, name: newName } : tab,
    ),
  }
}

// Add widget
export const addWidget = (
  config: DashboardConfig,
  tabId: string,
  widget: WidgetConfig,
): DashboardConfig => {
  return {
    ...config,
    tabs: config.tabs.map((tab) =>
      tab.id === tabId ? { ...tab, widgets: [...tab.widgets, widget] } : tab,
    ),
  }
}

// Remove widget
export const removeWidget = (
  config: DashboardConfig,
  tabId: string,
  widgetId: string,
): DashboardConfig => {
  return {
    ...config,
    tabs: config.tabs.map((tab) =>
      tab.id === tabId
        ? {
            ...tab,
            widgets: tab.widgets.filter((widget) => widget.id !== widgetId),
          }
        : tab,
    ),
  }
}

// Remove all widgets for specific robot (used when robot disconnects)
export const removeWidgetsByRobotId = (
  config: DashboardConfig,
  robotId: string,
): DashboardConfig => {
  return {
    ...config,
    tabs: config.tabs.map((tab) => ({
      ...tab,
      widgets: tab.widgets.filter((widget) => widget.robotId !== robotId),
    })),
  }
}

// Update widget position
export const updateWidgetPosition = (
  config: DashboardConfig,
  tabId: string,
  widgetId: string,
  position: { x: number; y: number; w: number; h: number },
): DashboardConfig => {
  return {
    ...config,
    tabs: config.tabs.map((tab) =>
      tab.id === tabId
        ? {
            ...tab,
            widgets: tab.widgets.map((widget) =>
              widget.id === widgetId ? { ...widget, position } : widget,
            ),
          }
        : tab,
    ),
  }
}
