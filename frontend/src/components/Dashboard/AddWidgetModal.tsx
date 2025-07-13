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
import { useRobotMapping } from "@/hooks/useRobotMapping"
import { UniversalWidgetConfigurator } from './widgets/dynamic/UniversalWidgetConfigurator'

interface AddWidgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (robotId: string, type: WidgetType, config?: any) => void;
  connectedRobots: string[];
}

export function AddWidgetModal({ isOpen, onClose, onAdd, connectedRobots }: AddWidgetModalProps) {
  console.log('AddWidgetModal rendering, robots:', connectedRobots)
  const [selectedRobotId, setSelectedRobotId] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("go2_low_state");
  const [showUniversalConfig, setShowUniversalConfig] = useState(false);
  const { getRobotName } = useRobotMapping();

  const robotCollection = createListCollection({
    items: connectedRobots.map(robotId => ({
      label: getRobotName(robotId),
      value: robotId,
    }))
  });

  const widgetTypeCollection = createListCollection({
    items: [
      { label: "Go2 Low State", value: "go2_low_state" },
      { label: "Go2 Ouster PointCloud", value: "go2_ouster_pointcloud" },
      { label: "Turtlesim Position", value: "turtlesim_position" },
      { label: "Turtlesim Remote Control", value: "turtlesim_remote_control" },
      { label: "Turtlesim Video", value: "turtlesim_video" },
      { label: "Universal Widget", value: "universal" }
    ]
  });

  const handleAdd = () => {
    if (selectedRobotId) {
      if (selectedType === 'universal') {
        setShowUniversalConfig(true);
      } else {
        onAdd(selectedRobotId, selectedType as WidgetType);
        onClose();
      }
    }
  };

  const handleUniversalConfigComplete = (config: any) => {
    onAdd(selectedRobotId, 'universal' as WidgetType, config);
    setShowUniversalConfig(false);
    onClose();
  };

  // Universal Widget 설정 모달이 열려있으면 해당 모달을 렌더링
  if (showUniversalConfig) {
    return (
      <UniversalWidgetConfigurator
        isOpen={showUniversalConfig}
        onClose={() => setShowUniversalConfig(false)}
        onComplete={handleUniversalConfigComplete}
        robotId={selectedRobotId}
      />
    );
  }

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
          <DialogTitle>Add Widget</DialogTitle>
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
              <Select.Label>Select Robot</Select.Label>
              <Select.Control>
                <Select.Trigger>
                  <Select.ValueText placeholder="Select a robot" />
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
              <Select.Label>Widget Type</Select.Label>
              <Select.Control>
                <Select.Trigger>
                  <Select.ValueText placeholder="Select widget type" />
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
              Cancel
            </Button>
          </DialogActionTrigger>
          <Button
            variant="solid"
            colorPalette="blue"
            onClick={handleAdd}
            disabled={!selectedRobotId}
          >
            Add
          </Button>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  );
} 