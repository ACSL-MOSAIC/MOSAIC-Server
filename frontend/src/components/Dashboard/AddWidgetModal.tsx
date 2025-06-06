import React, { useState } from 'react'
import {
  Box,
  Button,
  Select,
  Field,
  Dialog,
  Portal,
  createListCollection
} from "@chakra-ui/react"
import { WidgetType } from './types'

interface AddWidgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (robotId: string, type: WidgetType) => void;
  connectedRobots: string[];
}

export function AddWidgetModal({ isOpen, onClose, onAdd, connectedRobots }: AddWidgetModalProps) {
  const [selectedRobotId, setSelectedRobotId] = useState<string>('');
  const [selectedType, setSelectedType] = useState<WidgetType>('go2_low_state');

  const robotsCollection = createListCollection({
    items: connectedRobots.map(robotId => ({
      label: robotId,
      value: robotId
    }))
  });

  const typesCollection = createListCollection({
    items: [
      { label: 'Go2 Low State', value: 'go2_low_state' }
    ]
  });

  const handleSubmit = () => {
    if (selectedRobotId) {
      onAdd(selectedRobotId, selectedType);
      onClose();
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(e) => !e.open && onClose()}>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>위젯 추가</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <Box display="flex" flexDirection="column" gap={4}>
                <Field.Root required>
                  <Field.Label>로봇 선택</Field.Label>
                  <Field.RequiredIndicator />
                  <Select.Root 
                    collection={robotsCollection}
                    value={[selectedRobotId]}
                    onValueChange={(e) => setSelectedRobotId(e.value[0])}
                  >
                    <Select.HiddenSelect />
                    <Select.Control>
                      <Select.Trigger>
                        <Select.ValueText placeholder="로봇을 선택하세요" />
                      </Select.Trigger>
                      <Select.IndicatorGroup>
                        <Select.Indicator />
                      </Select.IndicatorGroup>
                    </Select.Control>
                    <Portal>
                      <Select.Positioner>
                        <Select.Content>
                          {robotsCollection.items.map((robot) => (
                            <Select.Item item={robot} key={robot.value}>
                              {robot.label}
                              <Select.ItemIndicator />
                            </Select.Item>
                          ))}
                        </Select.Content>
                      </Select.Positioner>
                    </Portal>
                  </Select.Root>
                </Field.Root>

                <Field.Root required>
                  <Field.Label>위젯 타입</Field.Label>
                  <Field.RequiredIndicator />
                  <Select.Root 
                    collection={typesCollection}
                    value={[selectedType]}
                    onValueChange={(e) => setSelectedType(e.value[0] as WidgetType)}
                  >
                    <Select.HiddenSelect />
                    <Select.Control>
                      <Select.Trigger>
                        <Select.ValueText />
                      </Select.Trigger>
                      <Select.IndicatorGroup>
                        <Select.Indicator />
                      </Select.IndicatorGroup>
                    </Select.Control>
                    <Portal>
                      <Select.Positioner>
                        <Select.Content>
                          {typesCollection.items.map((type) => (
                            <Select.Item item={type} key={type.value}>
                              {type.label}
                              <Select.ItemIndicator />
                            </Select.Item>
                          ))}
                        </Select.Content>
                      </Select.Positioner>
                    </Portal>
                  </Select.Root>
                </Field.Root>
              </Box>
            </Dialog.Body>
            <Dialog.Footer>
              <Button colorScheme="blue" mr={3} onClick={handleSubmit}>
                추가
              </Button>
              <Button variant="ghost" onClick={onClose}>
                취소
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
} 