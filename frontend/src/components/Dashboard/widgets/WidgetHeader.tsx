import { useRobotMapping } from "@/hooks/useRobotMapping.ts"
import { Badge, Button, Flex, HStack, Text, VStack } from "@chakra-ui/react"

export interface WidgetHeaderProps {
  title: string
  robot_id?: string
  isConnected: boolean
  onRemove?: () => void
}

export function WidgetHeader({
  title,
  robot_id,
  isConnected,
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

        <HStack gap={2}>
          <Badge colorScheme={isConnected ? "green" : "gray"} variant="subtle">
            {isConnected ? "Connected" : "Disconnected"}
          </Badge>
        </HStack>
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
    </HStack>
  )
}
