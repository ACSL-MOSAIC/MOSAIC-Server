import { useRobotMapping } from "@/hooks/useRobotMapping.ts"
import {
  Button,
  Flex,
  HStack,
  IconButton,
  Text,
  VStack,
} from "@chakra-ui/react"
import { IoSettings } from "react-icons/io5"

export interface WidgetHeaderProps {
  title: string
  robot_id?: string
  isConnected: boolean
  onSettingClick?: () => void
  onRemove?: () => void
}

export function WidgetHeader({
  title,
  robot_id,
  isConnected,
  onSettingClick,
  onRemove,
}: WidgetHeaderProps) {
  const { getRobotName } = useRobotMapping()

  return (
    <HStack cursor="move">
      <Flex
        justify="space-between"
        align="center"
        className="draggable-header"
        width="100%"
      >
        <VStack gap={0} align="start">
          <Text
            fontSize="sm"
            fontWeight="bold"
            color={isConnected ? "green.500" : "gray.500"}
          >
            {title}
          </Text>
          {robot_id && (
            <Text fontSize="xs" color="gray.600">
              Robot: {getRobotName(robot_id)}
            </Text>
          )}
        </VStack>
      </Flex>

      {onRemove && (
        <Button
          size="xs"
          variant="solid"
          colorScheme="teal"
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
        >
          Remove
        </Button>
      )}
      {onSettingClick && (
        <IconButton
          size="xs"
          variant="outline"
          colorScheme="teal"
          onClick={(e) => {
            e.stopPropagation()
            onSettingClick()
          }}
        >
          <IoSettings />
        </IconButton>
      )}
    </HStack>
  )
}
