import React, { useState } from 'react'
import {
  Box,
  Button,
  useDisclosure,
} from "@chakra-ui/react"

import { Select } from "@chakra-ui/select"
import { FormControl, FormLabel } from "@chakra-ui/form-control"
import { Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton } from "@chakra-ui/modal"
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

  const handleSubmit = () => {
    if (selectedRobotId) {
      onAdd(selectedRobotId, selectedType);
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>위젯 추가</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Box display="flex" flexDirection="column" gap={4}>
            <FormControl isRequired>
              <FormLabel>로봇 선택</FormLabel>
              <Select
                placeholder="로봇을 선택하세요"
                value={selectedRobotId}
                onChange={(e) => setSelectedRobotId(e.target.value)}
              >
                {connectedRobots.map((robotId) => (
                  <option key={robotId} value={robotId}>
                    {robotId}
                  </option>
                ))}
              </Select>
            </FormControl>

            <FormControl isRequired>
              <FormLabel>위젯 타입</FormLabel>
              <Select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as WidgetType)}
              >
                <option value="go2_low_state">Go2 Low State</option>
              </Select>
            </FormControl>
          </Box>
        </ModalBody>

        <ModalFooter>
          <Button colorScheme="blue" mr={3} onClick={handleSubmit}>
            추가
          </Button>
          <Button variant="ghost" onClick={onClose}>
            취소
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
} 