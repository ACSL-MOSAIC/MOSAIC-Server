import React, { useState } from "react"
import { Box, Grid, GridItem, Button, Icon, Heading } from "@chakra-ui/react"
import { AddIcon } from "@chakra-ui/icons"
import { WidgetConfig, WidgetType } from "./types"
import { v4 as uuidv4 } from 'uuid'
import { Go2LowStateWidget } from "./widgets/Go2LowStateWidget"
import { Go2LowStateStore } from "../../dashboard/store/go2-low-state.store"
import { GO2_LOW_STATE_TYPE } from "../../dashboard/parser/go2-low-state"
import { StoreManager } from "../../dashboard/store/store-manager"
import { AddWidgetModal } from "./AddWidgetModal"

interface DashboardGridProps {
  robotId: string;
  widgets: WidgetConfig[];
  onWidgetAdd: (widget: WidgetConfig) => void;
  onWidgetRemove: (widgetId: string) => void;
  onWidgetMove: (widgetId: string, position: { x: number; y: number }) => void;
  connectedRobots: string[];
}

export function DashboardGrid({
  robotId,
  widgets,
  onWidgetAdd,
  onWidgetRemove,
  onWidgetMove,
  connectedRobots
}: DashboardGridProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [currentWidget, setCurrentWidget] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAddWidget = (selectedRobotId: string, type: WidgetType) => {
    const newWidget: WidgetConfig = {
      id: uuidv4(),
      type,
      position: { x: 0, y: 0, w: 4, h: 4 },
      robotId: selectedRobotId,
      dataType: 'go2_low_state'
    };
    onWidgetAdd(newWidget);
  };

  const handleDragStart = (e: React.DragEvent, widgetId: string) => {
    setIsDragging(true);
    setCurrentWidget(widgetId);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleDragEnd = (e: React.DragEvent) => {
    if (!isDragging || !currentWidget) return;

    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;

    onWidgetMove(currentWidget, { x: dx, y: dy });
    setIsDragging(false);
    setCurrentWidget(null);
  };

  return (
    <Box minH="100vh" bg="gray.50" p={6}>
      <Box maxW="7xl" mx="auto">
        {/* 대시보드 헤더 */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={6}>
          <Heading size="lg">로봇 대시보드</Heading>
          <Button
            colorScheme="blue"
            onClick={() => setIsModalOpen(true)}
          >
            <Icon viewBox="0 0 24 24" mr={2}>
              <path
                fill="currentColor"
                d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"
              />
            </Icon>
            위젯 추가
          </Button>
        </Box>

        {/* 대시보드 그리드 */}
        <Grid
          templateColumns="repeat(12, 1fr)"
          gap={4}
          bg="white"
          borderRadius="2xl"
          boxShadow="xl"
          p={6}
        >
          {widgets.map((widget) => (
            <GridItem
              key={widget.id}
              colSpan={widget.position.w}
              rowSpan={widget.position.h}
              draggable
              onDragStart={(e) => handleDragStart(e, widget.id)}
              onDragEnd={handleDragEnd}
              cursor="move"
            >
              <Go2LowStateWidget
                robotId={widget.robotId}
                store={StoreManager.getInstance().getStore(widget.robotId, GO2_LOW_STATE_TYPE) as Go2LowStateStore}
                dataType="go2_low_state"
              />
            </GridItem>
          ))}
        </Grid>

        <AddWidgetModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onAdd={handleAddWidget}
          connectedRobots={connectedRobots}
        />
      </Box>
    </Box>
  );
} 