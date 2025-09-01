import { useWebSocket } from "@/contexts/WebSocketContext"
import { useRobotMapping } from "@/hooks/useRobotMapping"
import {
  Badge,
  Box,
  Button,
  Flex,
  Grid,
  Icon,
  IconButton,
  Text,
} from "@chakra-ui/react"
import { useCallback, useMemo } from "react"
import { IoPower, IoPowerOutline, IoSettings } from "react-icons/io5"

interface RobotConnectionPanelProps {
  connections: { [key: string]: boolean }
  onConnect: (robotId: string) => void
  onDisconnect: (robotId: string) => void
  onConnectAll: () => void
  onDisconnectAll: () => void
  onOpenDynamicTypeModal: (robotId: string) => void
}

function RobotConnectionPanel({
  connections,
  onConnect,
  onDisconnect,
  onConnectAll,
  onDisconnectAll,
  onOpenDynamicTypeModal,
}: RobotConnectionPanelProps) {
  const { robots } = useWebSocket()
  const { getRobotName } = useRobotMapping()

  const readyRobots = useMemo(
    () => robots.filter((robot) => robot.state === "READY_TO_CONNECT"),
    [robots],
  )
  const connectedRobots = useMemo(
    () => robots.filter((robot) => connections[robot.robot_id]),
    [robots, connections],
  )

  const getStatusColor = useCallback(
    (robotId: string) => {
      if (connections[robotId]) {
        return "green"
      }
      const robot = robots.find((r) => r.robot_id === robotId)
      if (robot?.state === "READY_TO_CONNECT") {
        return "blue"
      }
      return "gray"
    },
    [connections, robots],
  )

  const getStatusText = useCallback(
    (robotId: string) => {
      if (connections[robotId]) {
        return "Connected"
      }
      const robot = robots.find((r) => r.robot_id === robotId)
      if (robot?.state === "READY_TO_CONNECT") {
        return "Ready"
      }
      return "Unavailable"
    },
    [connections, robots],
  )

  if (robots.length === 0) {
    return (
      <Box textAlign="center" py={4} bg="gray.50" borderRadius="lg">
        <Text fontSize="lg" color="gray.500">
          No robots available for connection.
        </Text>
      </Box>
    )
  }

  return (
    <Box bg="white" p={6} borderRadius="lg" boxShadow="md" mb={6}>
      {/* Header */}
      <Flex justify="space-between" align="center" mb={4}>
        <Box>
          <Text fontSize="xl" fontWeight="bold" color="gray.700">
            Robot Connection Management
          </Text>
          <Text fontSize="sm" color="gray.500">
            {connectedRobots.length} of {robots.length} robots connected
          </Text>
        </Box>
        <Flex gap={2}>
          <Button
            colorScheme="green"
            size="sm"
            onClick={onConnectAll}
            disabled={readyRobots.length === 0}
          >
            <Icon as={IoPower} mr={2} />
            Connect All
          </Button>
          <Button
            colorScheme="red"
            size="sm"
            onClick={onDisconnectAll}
            disabled={connectedRobots.length === 0}
          >
            <Icon as={IoPowerOutline} mr={2} />
            Disconnect All
          </Button>
        </Flex>
      </Flex>

      {/* Robot list */}
      <Grid
        templateColumns={{
          base: "1fr",
          md: "repeat(2, 1fr)",
          lg: "repeat(4, 1fr)",
        }}
        gap={4}
      >
        {robots.map((robot) => {
          const isConnected = connections[robot.robot_id]
          const canConnect = robot.state === "READY_TO_CONNECT"

          return (
            <Box
              key={robot.robot_id}
              p={4}
              bg={isConnected ? "green.50" : "gray.50"}
              borderRadius="lg"
              borderWidth={2}
              borderColor={isConnected ? "green.200" : "gray.200"}
              transition="all 0.2s"
              _hover={{ transform: "translateY(-1px)", boxShadow: "md" }}
            >
              <Flex justify="space-between" align="center" mb={2}>
                <Text fontWeight="bold" fontSize="lg">
                  {getRobotName(robot.robot_id)}
                </Text>
                <Badge colorScheme={getStatusColor(robot.robot_id)}>
                  {getStatusText(robot.robot_id)}
                </Badge>
              </Flex>

              <Text fontSize="sm" color="gray.600" mb={3}>
                Status: {robot.state}
              </Text>

              <Flex gap={2} align="center">
                {isConnected ? (
                  <Button
                    colorScheme="red"
                    size="sm"
                    onClick={() => onDisconnect(robot.robot_id)}
                    flex="1"
                  >
                    <Icon as={IoPowerOutline} mr={2} />
                    Disconnect
                  </Button>
                ) : (
                  <Button
                    colorScheme="blue"
                    size="sm"
                    onClick={() => onConnect(robot.robot_id)}
                    disabled={!canConnect}
                    flex="1"
                  >
                    <Icon as={IoPowerOutline} mr={2} />
                    Connect
                  </Button>
                )}

                {/* 동적 타입 관리 버튼 */}
                <IconButton
                  size="sm"
                  variant="ghost"
                  onClick={() => onOpenDynamicTypeModal(robot.robot_id)}
                  aria-label="Dynamic Type Management"
                >
                  <IoSettings />
                </IconButton>
              </Flex>
            </Box>
          )
        })}
      </Grid>
    </Box>
  )
}

export default RobotConnectionPanel
