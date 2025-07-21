import React, { useState, useEffect, useRef } from "react"
import { Box, Button, Flex } from "@chakra-ui/react"
import { WidgetConfig, WidgetType, DashboardConfig } from "./types"
import { v4 as uuidv4 } from 'uuid'
import { TabManager } from "./TabManager"
import { useNavigate } from '@tanstack/react-router'
import { WebRTCConnection } from "@/rtc/webrtc-connection"
import { useWebSocket } from "@/contexts/WebSocketContext"
import { WidgetFactory } from "./widgets/WidgetFactory"
import { Responsive, WidthProvider } from "react-grid-layout"
import "react-grid-layout/css/styles.css"
import "react-resizable/css/styles.css"
import { toaster } from "@/components/ui/toaster"
import RobotConnectionPanel from "./RobotConnectionPanel"
import { 
  addTab, 
  removeTab, 
  renameTab, 
  addWidget, 
  removeWidget, 
} from "./dashboardUtils"
import { useDashboardConfigQuery, useDashboardConfigMutation } from "@/hooks/useDashboardConfig"
import { useQueryClient } from "@tanstack/react-query"
import { useRobotMapping } from "@/hooks/useRobotMapping"

const ResponsiveGridLayout = WidthProvider(Responsive);

interface DashboardGridProps {
  onOpenDynamicTypeModal: (robotId: string) => void
}

export function DashboardGrid({ onOpenDynamicTypeModal }: DashboardGridProps) {
  const { data: dashboardConfig, isLoading, refetch } = useDashboardConfigQuery();
  const { mutate: saveDashboardConfig } = useDashboardConfigMutation();
  const queryClient = useQueryClient();
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [connections, setConnections] = useState<{ [key: string]: boolean }>({});
  const ws = useWebSocket();
  const { getRobotName } = useRobotMapping();
  
  // Ref to manage WebRTC connection objects
  const rtcConnections = useRef<{ [key: string]: WebRTCConnection }>({});

  // Create refs for each robot (dynamically managed)
  const videoRefs = useRef<{ [key: string]: React.RefObject<HTMLVideoElement> }>({});
  const canvasRefs = useRef<{ [key: string]: React.RefObject<HTMLCanvasElement> }>({});
  const positionElementRefs = useRef<{ [key: string]: React.RefObject<HTMLDivElement> }>({});

  // Initialize refs function
  const initializeRefs = (robotId: string) => {
    if (!videoRefs.current[robotId]) {
      videoRefs.current[robotId] = React.createRef<HTMLVideoElement>();
    }
    if (!canvasRefs.current[robotId]) {
      canvasRefs.current[robotId] = React.createRef<HTMLCanvasElement>();
    }
    if (!positionElementRefs.current[robotId]) {
      positionElementRefs.current[robotId] = React.createRef<HTMLDivElement>();
    }
  };

  // Mark as unsaved when config changes
  const updateConfig = (newConfig: DashboardConfig) => {
    queryClient.setQueryData(["dashboardConfig"], newConfig);
    setHasUnsavedChanges(true);
  };

  // Save function
  const handleSave = () => {
    if (dashboardConfig) {
      saveDashboardConfig(dashboardConfig);
      setHasUnsavedChanges(false);
      toaster.create({
        title: "Settings Saved",
        description: "Dashboard settings have been saved successfully.",
      });
    }
  };

  // Connection state change handler
  const handleConnectionStateChange = (robotId: string, isConnected: boolean) => {
    setConnections(prev => ({
      ...prev,
      [robotId]: isConnected
    }));
  };

  // Connect to robot function
  const connectToRobot = async (robotId: string) => {
    try {
      if (rtcConnections.current[robotId]) {
        console.log(`Robot ${robotId} is already connected.`);
        return;
      }

      // Initialize refs
      initializeRefs(robotId);

      const connection = new WebRTCConnection({
        robotId,
        ws,
        onConnectionStateChange: (isConnected) => handleConnectionStateChange(robotId, isConnected)
      });

      await connection.startConnection();
      rtcConnections.current[robotId] = connection;
      console.log(`Robot ${robotId} connection completed`);
    } catch (error) {
      console.error(`Robot ${robotId} connection failed:`, error);
      throw error;
    }
  };

  // Disconnect from robot function
  const disconnectFromRobot = (robotId: string) => {
    const connection = rtcConnections.current[robotId];
    if (connection) {
      connection.disconnect();
      delete rtcConnections.current[robotId];
      handleConnectionStateChange(robotId, false);
      
      // Auto-remove widget feature removed - changed to show NO_DATA
    }
  };

  // Connect all robots function
  const handleConnectAllRobots = async () => {
    console.log('Attempting to connect all robots');
    const { robots } = useWebSocket();
    const readyRobots = robots.filter((robot) => robot.state === "READY_TO_CONNECT");
    
    for (const robot of readyRobots) {
      try {
        await connectToRobot(robot.robot_id);
      } catch (error) {
        console.error(`Robot ${robot.robot_id} connection failed:`, error);
      }
    }
  };

  // Disconnect all robots function
  const handleDisconnectAllRobots = () => {
    Object.keys(rtcConnections.current).forEach(robotId => {
      disconnectFromRobot(robotId);
    });
  };

  // Tab management functions
  const handleAddTab = (tabName: string) => {
    if (dashboardConfig) {
      const newConfig = addTab(dashboardConfig, tabName);
      updateConfig(newConfig);
    }
  };

  const handleRemoveTab = (tabId: string) => {
    if (dashboardConfig) {
      const newConfig = removeTab(dashboardConfig, tabId);
      updateConfig(newConfig);
    }
  };

  const handleRenameTab = (tabId: string, newName: string) => {
    if (dashboardConfig) {
      const newConfig = renameTab(dashboardConfig, tabId, newName);
      updateConfig(newConfig);
    }
  };

  const handleTabChange = (tabId: string) => {
    if (dashboardConfig) {
      updateConfig({
        ...dashboardConfig,
        activeTabId: tabId
      });
    }
  };

  const handleAddWidget = (selectedRobotId: string, type: WidgetType, config?: any) => {
    if (!dashboardConfig) return;

    // Set appropriate data type based on widget type
    let dataType: string;
    switch (type) {
      case 'go2_low_state':
        dataType = 'go2_low_state';
        break;
      case 'go2_ouster_pointcloud':
        dataType = 'go2_ouster_pointcloud';
        break;
      case 'turtlesim_position':
        dataType = 'turtlesim_position';
        break;
      case 'turtlesim_remote_control':
        dataType = 'turtlesim_remote_control';
        break;
      case 'turtlesim_video':
        dataType = 'turtlesim_video';
        break;
      case 'universal':
        dataType = 'universal';
        break;
      default:
        dataType = 'go2_low_state';
    }

    const newWidget: WidgetConfig = {
      id: uuidv4(),
      type,
      position: { x: 0, y: 0, w: 4, h: 4 },
      robotId: selectedRobotId,
      dataType,
      config
    };

    const newConfig = addWidget(dashboardConfig, dashboardConfig.activeTabId, newWidget);
    updateConfig(newConfig);
  };

  const handleRemoveWidget = (widgetId: string) => {
    if (dashboardConfig) {
      const newConfig = removeWidget(dashboardConfig, dashboardConfig.activeTabId, widgetId);
      updateConfig(newConfig);
    }
  };

  // Layout change handler
  const handleLayoutChange = (layout: any) => {
    if (!dashboardConfig) return;

    const newConfig = {
      ...dashboardConfig,
      tabs: dashboardConfig.tabs.map(tab => {
        if (tab.id === dashboardConfig.activeTabId) {
          return {
            ...tab,
            widgets: tab.widgets.map(widget => {
              const newLayout = layout.find((l: any) => l.i === widget.id);
              if (newLayout) {
                return {
                  ...widget,
                  position: {
                    x: newLayout.x,
                    y: newLayout.y,
                    w: newLayout.w,
                    h: newLayout.h
                  }
                };
              }
              return widget;
            })
          };
        }
        return tab;
      })
    };
    updateConfig(newConfig);
  };

  // UniversalWidget에서 config 수정 시 위젯만 교체
  const handleUpdateWidgetConfig = (widgetId: string, newConfig: any) => {
    if (!dashboardConfig) return;
    const newTabs = dashboardConfig.tabs.map(tab => {
      if (tab.id !== dashboardConfig.activeTabId) return tab;
      return {
        ...tab,
        widgets: tab.widgets.map(w =>
          w.id === widgetId ? { ...w, config: newConfig } : w
        )
      }
    })
    updateConfig({ ...dashboardConfig, tabs: newTabs })
  }

  // Disconnect all connections on component unmount
  useEffect(() => {
    return () => {
      Object.keys(rtcConnections.current).forEach(robotId => {
        disconnectFromRobot(robotId);
      });
    };
  }, []);

  if (!dashboardConfig) {
    return <Box p={4}>Loading...</Box>;
  }

  const activeTab = dashboardConfig.tabs.find(tab => tab.id === dashboardConfig.activeTabId);
  if (!activeTab) {
    return <Box p={4}>Tab not found.</Box>;
  }

  // List of connected robot IDs
  const connectedRobotIds = Object.keys(connections).filter(id => connections[id]);

  return (
    <Box p={4} marginTop="64px">
      {/* Robot connection management panel */}
      <RobotConnectionPanel
        connections={connections}
        onConnect={connectToRobot}
        onDisconnect={disconnectFromRobot}
        onConnectAll={handleConnectAllRobots}
        onDisconnectAll={handleDisconnectAllRobots}
        onOpenDynamicTypeModal={onOpenDynamicTypeModal}
      />

      {/* Dashboard controls */}
      <Flex justify="flex-end" mb={4}>
        <Button
          colorScheme="teal"
          onClick={handleSave}
          disabled={!hasUnsavedChanges}
        >
          💾 {hasUnsavedChanges ? "Save" : "Saved"}
        </Button>
      </Flex>

      {/* Tab manager */}
      <TabManager
        tabs={dashboardConfig.tabs.map(tab => ({ id: tab.id, name: tab.name }))}
        activeTabId={dashboardConfig.activeTabId}
        onTabChange={handleTabChange}
        onAddTab={handleAddTab}
        onRemoveTab={handleRemoveTab}
        onRenameTab={handleRenameTab}
        onAddWidget={handleAddWidget}
        connectedRobots={connectedRobotIds}
      />

      <ResponsiveGridLayout
        className="layout"
        layouts={{ lg: activeTab.widgets.map(w => ({
          i: w.id,
          x: w.position.x,
          y: w.position.y,
          w: w.position.w,
          h: w.position.h,
          minW: 2,
          minH: 2,
          maxW: 12,
          maxH: 12
        })) }}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={100}
        width={1200}
        onLayoutChange={handleLayoutChange}
        isDraggable={true}
        isResizable={true}
        margin={[16, 16]}
        draggableHandle=".widget-header"
      >
        {activeTab.widgets.map((widget) => (
          <Box
            key={widget.id}
            bg="white"
            p={4}
            borderRadius="md"
            boxShadow="sm"
            height="100%"
            display="flex"
            flexDirection="column"
            mb={4}
          >
            <WidgetFactory 
              type={widget.type}
              robotId={widget.robotId}
              dataType={widget.dataType}
              connections={connections}
              config={widget.config}
              widgetId={widget.id}
              onRemove={() => handleRemoveWidget(widget.id)}
              onUpdateConfig={(newConfig) => handleUpdateWidgetConfig(widget.id, newConfig)}
            />
          </Box>
        ))}
      </ResponsiveGridLayout>
    </Box>
  );
} 