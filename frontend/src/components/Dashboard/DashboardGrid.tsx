import React, { useState, useEffect, useRef } from "react"
import { Box, Grid, GridItem, Button, useDisclosure, Flex } from "@chakra-ui/react"
import { WidgetConfig, WidgetType } from "./types"
import { v4 as uuidv4 } from 'uuid'
import { AddWidgetModal } from "./AddWidgetModal"
import { useNavigate } from '@tanstack/react-router'
import { WebRTCConnection } from "@/rtc/webrtc-connection"
import { useWebSocket } from "@/contexts/WebSocketContext"

interface DashboardGridProps {
  robotIdList: string[];
  userId: string;
}

export function DashboardGrid({ robotIdList, userId }: DashboardGridProps) {
  const { open, onOpen, onClose } = useDisclosure();
  const [widgets, setWidgets] = useState<WidgetConfig[]>([]);
  const [connections, setConnections] = useState<{ [key: string]: boolean }>({});
  const ws = useWebSocket();
  
  // WebRTC 연결 객체들을 관리하는 ref
  const rtcConnections = useRef<{ [key: string]: WebRTCConnection }>({});

  // 각 로봇별 ref 생성
  const videoRefs = useRef<{ [key: string]: React.RefObject<HTMLVideoElement> }>({});
  const canvasRefs = useRef<{ [key: string]: React.RefObject<HTMLCanvasElement> }>({});
  const positionElementRefs = useRef<{ [key: string]: React.RefObject<HTMLDivElement> }>({});

  // ref 초기화
  robotIdList.forEach(id => {
    if (!videoRefs.current[id]) {
      videoRefs.current[id] = React.createRef<HTMLVideoElement>();
    }
    if (!canvasRefs.current[id]) {
      canvasRefs.current[id] = React.createRef<HTMLCanvasElement>();
    }
    if (!positionElementRefs.current[id]) {
      positionElementRefs.current[id] = React.createRef<HTMLDivElement>();
    }
  });

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
      // 이미 연결된 경우 체크
      if (rtcConnections.current[robotId]) {
        console.log(`로봇 ${robotId}는 이미 연결되어 있습니다.`);
        return;
      }

      // 새로운 WebRTC 연결 생성
      const connection = new WebRTCConnection({
        robotId,
        ws,
        onConnectionStateChange: (isConnected) => handleConnectionStateChange(robotId, isConnected)
      });

      // 연결 시작
      await connection.startConnection();
      
      // 연결 객체 저장
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
    }
  };

  // 모든 로봇 연결 함수
  const handleConnectAllRobots = async () => {
    console.log('모든 로봇 연결 시도');
    for (const robotId of robotIdList) {
      try {
        await connectToRobot(robotId);
      } catch (error) {
        console.error(`로봇 ${robotId} 연결 실패:`, error);
      }
    }
  };

  const handleAddWidget = (selectedRobotId: string, type: WidgetType) => {
    const newWidget: WidgetConfig = {
      id: uuidv4(),
      type,
      position: { x: 0, y: 0, w: 4, h: 4 },
      robotId: selectedRobotId,
      dataType: 'go2_low_state'
    };
    setWidgets(prev => [...prev, newWidget]);
  };

  const handleRemoveWidget = (widgetId: string) => {
    setWidgets(prev => prev.filter(w => w.id !== widgetId));
  };

  // 컴포넌트 언마운트 시 모든 연결 해제
  useEffect(() => {
    return () => {
      Object.keys(rtcConnections.current).forEach(robotId => {
        disconnectFromRobot(robotId);
      });
    };
  }, []);

  return (
    <Box p={4}>
      <Flex justify="space-between" mb={4}>
        <Button 
          colorScheme="green" 
          onClick={handleConnectAllRobots}
        >
          모든 로봇 연결
        </Button>
        <Button 
          colorScheme="blue" 
          onClick={onOpen}
        >
          위젯 추가
        </Button>
      </Flex>

      <Grid templateColumns="repeat(3, 1fr)" gap={4}>
        {widgets.map((widget, index) => (
          <GridItem 
            key={`${widget.robotId}-${widget.type}-${index}`}
            colSpan={1}
            bg="white"
            p={4}
            borderRadius="md"
            boxShadow="sm"
          >
            <Box>
              <Box mb={2}>
                <strong>로봇 ID:</strong> {widget.robotId}
              </Box>
              <Box mb={2}>
                <strong>위젯 타입:</strong> {widget.type}
              </Box>
              <Button 
                size="sm" 
                colorScheme="red" 
                onClick={() => handleRemoveWidget(widget.id)}
              >
                제거
              </Button>
            </Box>
          </GridItem>
        ))}
      </Grid>

      <AddWidgetModal
        isOpen={open}
        onClose={onClose}
        onAdd={handleAddWidget}
        connectedRobots={robotIdList}
      />
    </Box>
  );
} 