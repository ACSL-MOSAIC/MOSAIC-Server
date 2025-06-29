import { Box, Grid, Text, Button, Flex, Badge, Icon } from "@chakra-ui/react"
import { useWebSocket } from "@/contexts/WebSocketContext"
import { IoVideocam, IoVideocamOff, IoPower, IoPowerOutline } from "react-icons/io5"

interface RobotConnectionPanelProps {
  connections: { [key: string]: boolean }
  onConnect: (robotId: string) => void
  onDisconnect: (robotId: string) => void
  onConnectAll: () => void
  onDisconnectAll: () => void
}

function RobotConnectionPanel({ 
  connections, 
  onConnect, 
  onDisconnect, 
  onConnectAll, 
  onDisconnectAll 
}: RobotConnectionPanelProps) {
  const { robots } = useWebSocket()

  const readyRobots = robots.filter((robot) => robot.state === "READY_TO_CONNECT")
  const connectedRobots = robots.filter((robot) => connections[robot.robot_id])
  const disconnectedRobots = robots.filter((robot) => !connections[robot.robot_id])

  const getStatusColor = (robotId: string) => {
    if (connections[robotId]) {
      return "green"
    }
    const robot = robots.find(r => r.robot_id === robotId)
    if (robot?.state === "READY_TO_CONNECT") {
      return "blue"
    }
    return "gray"
  }

  const getStatusText = (robotId: string) => {
    if (connections[robotId]) {
      return "연결됨"
    }
    const robot = robots.find(r => r.robot_id === robotId)
    if (robot?.state === "READY_TO_CONNECT") {
      return "연결 가능"
    }
    return "연결 불가"
  }

  if (robots.length === 0) {
    return (
      <Box textAlign="center" py={4} bg="gray.50" borderRadius="lg">
        <Text fontSize="lg" color="gray.500">
          연결 가능한 로봇이 없습니다.
        </Text>
      </Box>
    )
  }

  return (
    <Box bg="white" p={6} borderRadius="lg" boxShadow="md" mb={6}>
      {/* 헤더 */}
      <Flex justify="space-between" align="center" mb={4}>
        <Box>
          <Text fontSize="xl" fontWeight="bold" color="gray.700">
            로봇 연결 관리
          </Text>
          <Text fontSize="sm" color="gray.500">
            총 {robots.length}개 로봇 중 {connectedRobots.length}개 연결됨
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
            전체 연결
          </Button>
          <Button
            colorScheme="red"
            size="sm"
            onClick={onDisconnectAll}
            disabled={connectedRobots.length === 0}
          >
            <Icon as={IoPowerOutline} mr={2} />
            전체 해제
          </Button>
        </Flex>
      </Flex>

      {/* 로봇 목록 */}
      <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }} gap={4}>
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
                  {robot.robot_id}
                </Text>
                <Badge colorScheme={getStatusColor(robot.robot_id)}>
                  {getStatusText(robot.robot_id)}
                </Badge>
              </Flex>
              
              <Text fontSize="sm" color="gray.600" mb={3}>
                상태: {robot.state}
              </Text>

              <Flex gap={2}>
                {isConnected ? (
                  <Button
                    colorScheme="red"
                    size="sm"
                    onClick={() => onDisconnect(robot.robot_id)}
                    flex="1"
                  >
                    <Icon as={IoVideocamOff} mr={2} />
                    연결 해제
                  </Button>
                ) : (
                  <Button
                    colorScheme="blue"
                    size="sm"
                    onClick={() => onConnect(robot.robot_id)}
                    disabled={!canConnect}
                    flex="1"
                  >
                    <Icon as={IoVideocam} mr={2} />
                    연결
                  </Button>
                )}
              </Flex>
            </Box>
          )
        })}
      </Grid>
    </Box>
  )
}

export default RobotConnectionPanel 