import React, { useState } from 'react'
import {
  Button,
  Stack,
  Select,
  createListCollection,
  Portal,
} from "@chakra-ui/react"
import { WidgetType } from './types'
import {
  DialogActionTrigger,
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTitle,
} from "@/components/ui/dialog"

interface AddWidgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (robotId: string, type: WidgetType) => void;
  connectedRobots: string[];
}

export function AddWidgetModal({ isOpen, onClose, onAdd, connectedRobots }: AddWidgetModalProps) {
  console.log('AddWidgetModal 렌더링, 로봇 :', connectedRobots)
  const [selectedRobotId, setSelectedRobotId] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("go2_low_state");

  const robotCollection = createListCollection({
    items: connectedRobots.map(robotId => ({
      label: `로봇 ${robotId.slice(0, 8)}...`,
      value: robotId,
    }))
  });

  const widgetTypeCollection = createListCollection({
    items: [
      { label: "Go2 Low State", value: "go2_low_state" },
      { label: "Go2 Ouster PointCloud", value: "go2_ouster_pointcloud" },
      { label: "Turtlesim Position", value: "turtlesim_position" },
      { label: "Turtlesim Remote Control", value: "turtlesim_remote_control" }
    ]
  });

  const handleAdd = () => {
    if (selectedRobotId) {
      onAdd(selectedRobotId, selectedType as WidgetType);
      onClose();
    }
  };

  return (
    <DialogRoot
      size={{ base: "xs", md: "md" }}
      placement="center"
      open={isOpen}
      onOpenChange={({ open }) => !open && onClose()}
    >
      <DialogContent
        style={{
          overflow: 'visible',
          position: 'relative',
          zIndex: 1000
        }}
      >
        <DialogCloseTrigger />
        <DialogHeader>
          <DialogTitle>위젯 추가</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <Stack gap={4}>
            <Select.Root
              collection={robotCollection}
              value={[selectedRobotId]}
              onValueChange={(details) => setSelectedRobotId(details.value[0])}
              size="md"
            >
              <Select.HiddenSelect />
              <Select.Label>로봇 선택</Select.Label>
              <Select.Control>
                <Select.Trigger>
                  <Select.ValueText placeholder="로봇을 선택하세요" />
                </Select.Trigger>
                <Select.IndicatorGroup>
                  <Select.Indicator />
                </Select.IndicatorGroup>
              </Select.Control>
              <Portal>
                <Select.Positioner style={{ zIndex: 9999 }}>
                  <Select.Content style={{ 
                    position: 'relative',
                    zIndex: 9999,
                    backgroundColor: 'white'
                  }}>
                    {robotCollection.items.map((robot) => (
                      <Select.Item item={robot} key={robot.value}>
                        {robot.label}
                        <Select.ItemIndicator />
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Positioner>
              </Portal>
            </Select.Root>

            <Select.Root
              collection={widgetTypeCollection}
              value={[selectedType]}
              onValueChange={(details) => setSelectedType(details.value[0])}
              size="md"
            >
              <Select.HiddenSelect />
              <Select.Label>위젯 타입</Select.Label>
              <Select.Control>
                <Select.Trigger>
                  <Select.ValueText placeholder="위젯 타입을 선택하세요" />
                </Select.Trigger>
                <Select.IndicatorGroup>
                  <Select.Indicator />
                </Select.IndicatorGroup>
              </Select.Control>
              <Portal>
                <Select.Positioner style={{ zIndex: 9999 }}>
                  <Select.Content style={{ 
                    position: 'relative',
                    zIndex: 9999,
                    backgroundColor: 'white'
                  }}>
                    {widgetTypeCollection.items.map((type) => (
                      <Select.Item item={type} key={type.value}>
                        {type.label}
                        <Select.ItemIndicator />
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Positioner>
              </Portal>
            </Select.Root>
          </Stack>
        </DialogBody>
        <DialogFooter gap={2}>
          <DialogActionTrigger asChild>
            <Button
              variant="subtle"
              colorPalette="gray"
            >
              취소
            </Button>
          </DialogActionTrigger>
          <Button
            variant="solid"
            colorPalette="blue"
            onClick={handleAdd}
            disabled={!selectedRobotId}
          >
            추가
          </Button>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  );
} 