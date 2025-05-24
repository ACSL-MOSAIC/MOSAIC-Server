import { Box, Grid, Heading, Text, Button, Flex } from "@chakra-ui/react"
import { useNavigate } from "@tanstack/react-router"
import { useWebSocket } from "@/contexts/WebSocketContext"
import { useState } from "react"
import useCustomToast from "@/hooks/useCustomToast"

function ConnectList() {
  const { robots } = useWebSocket()
  const navigate = useNavigate()
  const { showErrorToast } = useCustomToast()
  const [selectedRobots, setSelectedRobots] = useState<Set<string>>(new Set())

  const readyRobots = robots.filter((robot) => robot.state === "READY_TO_CONNECT")

  const handleRobotSelect = (robotId: string) => {
    setSelectedRobots(prev => {
      const newSelected = new Set(prev)
      if (newSelected.has(robotId)) {
        newSelected.delete(robotId)
      } else {
        newSelected.add(robotId)
      }
      return newSelected
    })
  }

  const handleConnect = () => {
    if (selectedRobots.size === 0) {
      showErrorToast("로봇을 선택해주세요")
      return
    }

    // 선택된 로봇 ID들을 URL 파라미터로 전달
    const robotIds = Array.from(selectedRobots).join(',')
    navigate({ to: '/connect/$robotId', params: { robotId: robotIds } })
  }

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
    <Box p={6}>
      <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }} gap={6}>
        {readyRobots.map((robot) => (
          <Box
            key={robot.robot_id}
            p={6}
            cursor="pointer"
            bg="white"
            borderRadius="lg"
            boxShadow="md"
            borderWidth={2}
            borderColor={selectedRobots.has(robot.robot_id) ? "blue.500" : "transparent"}
            onClick={() => handleRobotSelect(robot.robot_id)}
            _hover={{ transform: "translateY(-2px)", transition: "all 0.2s" }}
          >
            <Heading size="md" mb={2}>
              {robot.robot_id}
            </Heading>
            <Text color="gray.500">ID: {robot.robot_id}</Text>
            <Text color="gray.500">상태: {robot.state}</Text>
          </Box>
        ))}
      </Grid>

      <Flex justify="flex-end" mt={6} gap={4}>
        <Button
          colorScheme="blue"
          size="lg"
          onClick={handleConnect}
          disabled={selectedRobots.size === 0}
        >
          선택한 로봇 연결하기 ({selectedRobots.size}개)
        </Button>
      </Flex>
    </Box>
  )
}

export default ConnectList 