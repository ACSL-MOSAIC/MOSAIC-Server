import { Box, Grid, Heading, Text } from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { Link as RouterLink } from "@tanstack/react-router"
import { useEffect, useState, useRef } from "react"
import { RobotsService, type RobotsPublic, type RobotPublic } from "@/client"

interface RobotInfo {
  robot_id: string
  state: string
}

function useRobotWebSocket(userId: string) {
  const [robots, setRobots] = useState<RobotInfo[]>([])
  const [ws, setWs] = useState<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>()

  const connectWebSocket = () => {
    const websocket = new WebSocket(`ws://localhost:8000/ws/user?user_id=${userId}`)

    websocket.onopen = () => {
      console.log("WebSocket 연결됨")
      // 로봇 리스트 요청
      websocket.send(JSON.stringify({
        type: "get_robot_list",
        user_id: userId
      }))
    }

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.type === "robot_list") {
        setRobots(data.robots)
      }
    }

    websocket.onerror = (error) => {
      console.error("WebSocket 에러:", error)
    }

    websocket.onclose = () => {
        console.log("WebSocket 연결 종료")
        
      reconnectTimeoutRef.current = setTimeout(() => {
        console.log("WebSocket 재연결 시도...")
        connectWebSocket()
      }, 5000)
    }

    setWs(websocket)
  }

  useEffect(() => {
    connectWebSocket()

    return () => {
      if (ws) {
        ws.close()
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
    }
  }, [userId])

  return robots
}

function ConnectList() {
  // 임시로 하드코딩된 userId 사용 (실제로는 인증된 사용자의 ID를 사용해야 함)
  const userId = "9942c844-0ec6-4f1f-9df6-07397950af58"
  const robots = useRobotWebSocket(userId)

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