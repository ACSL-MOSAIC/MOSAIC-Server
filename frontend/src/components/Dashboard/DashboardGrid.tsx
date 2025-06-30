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

export function DashboardGrid() {
  const { data: dashboardConfig, isLoading, refetch } = useDashboardConfigQuery();
  const { mutate: saveDashboardConfig } = useDashboardConfigMutation();
  const queryClient = useQueryClient();
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [connections, setConnections] = useState<{ [key: string]: boolean }>({});
  const ws = useWebSocket();
  const { getRobotName } = useRobotMapping();
  
  // WebRTC 연결 객체들을 관리하는 ref
  const rtcConnections = useRef<{ [key: string]: WebRTCConnection }>({});

  // 각 로봇별 ref 생성 (동적으로 관리)
  const videoRefs = useRef<{ [key: string]: React.RefObject<HTMLVideoElement> }>({});
  const canvasRefs = useRef<{ [key: string]: React.RefObject<HTMLCanvasElement> }>({});
  const positionElementRefs = useRef<{ [key: string]: React.RefObject<HTMLDivElement> }>({});

  // ref 초기화 함수
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

  // 설정 변경 시 unsaved 상태로 표시
  const updateConfig = (newConfig: DashboardConfig) => {
    queryClient.setQueryData(["dashboardConfig"], newConfig);
    setHasUnsavedChanges(true);
  };

  // 저장하기 함수
  const handleSave = () => {
    if (dashboardConfig) {
      saveDashboardConfig(dashboardConfig);
      setHasUnsavedChanges(false);
      toaster.create({
        title: "설정 저장됨",
        description: "대시보드 설정이 성공적으로 저장되었습니다.",
      });
    }
  };

  // 연결 상태 변경 핸들러
  const handleConnectionStateChange = (robotId: string, isConnected: boolean) => {
    setConnections(prev => ({
      ...prev,
      [robotId]: isConnected
    }));
  };

  // 로봇 연결 함수
  const connectToRobot = async (robotId: string) => {
    try {
      if (rtcConnections.current[robotId]) {
        console.log(`로봇 ${robotId}는 이미 연결되어 있습니다.`);
        return;
      }

      // ref 초기화
      initializeRefs(robotId);

      const connection = new WebRTCConnection({
        robotId,
        ws,
        onConnectionStateChange: (isConnected) => handleConnectionStateChange(robotId, isConnected)
      });

      await connection.startConnection();
      rtcConnections.current[robotId] = connection;
      console.log(`로봇 ${robotId} 연결 완료`);
    } catch (error) {
      console.error(`로봇 ${robotId} 연결 실패:`, error);
      throw error;
    }
  };

  // 로봇 연결 해제 함수
  const disconnectFromRobot = (robotId: string) => {
    const connection = rtcConnections.current[robotId];
    if (connection) {
      connection.disconnect();
      delete rtcConnections.current[robotId];
      handleConnectionStateChange(robotId, false);
      
      // 위젯 자동 제거 기능 제거 - NO_DATA로 표시하도록 변경
    }
  };

  // 모든 로봇 연결 함수
  const handleConnectAllRobots = async () => {
    console.log('모든 로봇 연결 시도');
    const { robots } = useWebSocket();
    const readyRobots = robots.filter((robot) => robot.state === "READY_TO_CONNECT");
    
    for (const robot of readyRobots) {
      try {
        await connectToRobot(robot.robot_id);
      } catch (error) {
        console.error(`로봇 ${robot.robot_id} 연결 실패:`, error);
      }
    }
  };

  // 모든 로봇 연결 해제 함수
  const handleDisconnectAllRobots = () => {
    Object.keys(rtcConnections.current).forEach(robotId => {
      disconnectFromRobot(robotId);
    });
  };

  // 탭 관리 함수들
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

  const handleAddWidget = (selectedRobotId: string, type: WidgetType) => {
    if (!dashboardConfig) return;

    // 위젯 타입에 따라 적절한 데이터 타입 설정
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
      default:
        dataType = 'go2_low_state';
    }

    const newWidget: WidgetConfig = {
      id: uuidv4(),
      type,
      position: { x: 0, y: 0, w: 4, h: 4 },
      robotId: selectedRobotId,
      dataType
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

  // 레이아웃 변경 핸들러
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

  // 컴포넌트 언마운트 시 모든 연결 해제
  useEffect(() => {
    return () => {
      Object.keys(rtcConnections.current).forEach(robotId => {
        disconnectFromRobot(robotId);
      });
    };
  }, []);

  if (!dashboardConfig) {
    return <Box p={4}>로딩 중...</Box>;
  }

  const activeTab = dashboardConfig.tabs.find(tab => tab.id === dashboardConfig.activeTabId);
  if (!activeTab) {
    return <Box p={4}>탭을 찾을 수 없습니다.</Box>;
  }

  // 연결된 로봇 ID 목록
  const connectedRobotIds = Object.keys(connections).filter(id => connections[id]);

  return (
    <Box p={4} marginTop="64px">
      {/* 로봇 연결 관리 패널 */}
      <RobotConnectionPanel
        connections={connections}
        onConnect={connectToRobot}
        onDisconnect={disconnectFromRobot}
        onConnectAll={handleConnectAllRobots}
        onDisconnectAll={handleDisconnectAllRobots}
      />

      {/* 대시보드 컨트롤 */}
      <Flex justify="flex-end" mb={4}>
        <Button
          colorScheme="teal"
          onClick={handleSave}
          disabled={!hasUnsavedChanges}
        >
          💾 {hasUnsavedChanges ? "저장하기" : "저장됨"}
        </Button>
      </Flex>

      {/* 탭 관리자 */}
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
          >
            <Flex justify="space-between" mb={2} className="widget-header" cursor="move">
              <Box>
                <strong>로봇:</strong> {getRobotName(widget.robotId)}
              </Box>
              <Button 
                size="sm" 
                colorScheme="red" 
                onClick={() => handleRemoveWidget(widget.id)}
              >
                제거
              </Button>
            </Flex>
            <Box flex="1" overflow="hidden">
              <WidgetFactory 
                type={widget.type}
                robotId={widget.robotId}
                dataType={widget.dataType}
                connections={connections}
              />
            </Box>
          </Box>
        ))}
      </ResponsiveGridLayout>
    </Box>
  );
} 