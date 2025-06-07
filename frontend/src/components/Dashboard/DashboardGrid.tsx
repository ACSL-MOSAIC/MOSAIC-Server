import React, { useState, useEffect, useRef } from "react"
import { Box, Grid, GridItem, Button, useDisclosure, Flex } from "@chakra-ui/react"
import { WidgetConfig, WidgetType } from "./types"
import { v4 as uuidv4 } from 'uuid'
import { AddWidgetModal } from "./AddWidgetModal"
import { useMultiRobot } from "@/hooks/useMultiRobot"
import { useNavigate } from '@tanstack/react-router'

interface DashboardGridProps {
  robotIdList: string[];
  userId: string;
}

export function DashboardGrid({ robotIdList, userId }: DashboardGridProps) {
  const { open, onOpen, onClose } = useDisclosure();
  // const navigate = useNavigate();
  // const [isDragging, setIsDragging] = useState(false);
  // const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  // const [currentWidget, setCurrentWidget] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState<{ [key: string]: boolean }>({});
  const [widgets, setWidgets] = useState<WidgetConfig[]>([]);

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

  const { connections, connectToRobot, disconnectFromRobot, connectionRefs } = useMultiRobot({
    userId,
    videoRefs: videoRefs.current,
    canvasRefs: canvasRefs.current,
    positionElementRefs: positionElementRefs.current
  });

  // 연결 상태 모니터링 및 재연결
  useEffect(() => {
    console.log('현재 연결 상태:', connections);
    
    // 연결이 끊어진 로봇 확인
    robotIdList.forEach(robotId => {
      const isConnected = connections[robotId]?.isConnected;
      const hasConnectionRef = connectionRefs.current && robotId in connectionRefs.current;
      
      // 연결이 끊어졌고, connectionRef가 있는 경우에만 재연결 시도
      if (!isConnected && hasConnectionRef) {
        console.log(`로봇 ${robotId} 연결 끊김, 재연결 시도`);
        connectToRobot(robotId).catch(error => {
          console.error(`로봇 ${robotId} 재연결 실패:`, error);
        });
      }
    });
  }, [connections, robotIdList, connectToRobot, connectionRefs]);

  const handleConnectAllRobots = async () => {
    console.log('모든 로봇 연결 시도');
    for (const robotId of robotIdList) {
      try {
        console.log(`로봇 ${robotId} 연결 시도`);
        await connectToRobot(robotId);
        console.log(`로봇 ${robotId} 연결 완료`);
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

  // 연결된 로봇 ID 목록을 useMemo로 메모이제이션
  const connectedRobotIds = React.useMemo(() => 
    Object.keys(connections).filter(robotId => 
      connections[robotId]?.isConnected
    ),
    [connections]
  );

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
          onClick={() => {
            console.log('위젯 추가 버튼 클릭');
            onOpen();
          }}
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