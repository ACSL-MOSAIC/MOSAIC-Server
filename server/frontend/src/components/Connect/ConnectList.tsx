import { Box, Grid, Heading, Text } from "@chakra-ui/react"
import { Link as RouterLink } from "@tanstack/react-router"
import { useWebSocket } from "@/contexts/WebSocketContext"

function ConnectList() {
  const { robots } = useWebSocket()

  const readyRobots = robots.filter((robot) => robot.state === "ready_to_connect")

  if (readyRobots.length === 0) {
    return (
      <Box textAlign="center" py={8}>
        <Text fontSize="lg" color="gray.500">
          연결 가능한 로봇이 없습니다.
        </Text>
      </Box>
    )
  }

  return (
    <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }} gap={6}>
      {readyRobots.map((robot) => (
        <RouterLink key={robot.robot_id} to={`/connect/${robot.robot_id}`}>
          <Box
            p={6}
            cursor="pointer"
            bg="white"
            borderRadius="lg"
            boxShadow="md"
            _hover={{ transform: "translateY(-2px)", transition: "all 0.2s" }}
          >
            <Heading size="md" mb={2}>
              {robot.robot_id}
            </Heading>
            <Text color="gray.500">ID: {robot.robot_id}</Text>
            <Text color="gray.500">상태: {robot.state}</Text>
          </Box>
        </RouterLink>
      ))}
    </Grid>
  )
}

export default ConnectList 