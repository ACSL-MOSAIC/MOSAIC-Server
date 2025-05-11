import { Box, Button, Flex, Text } from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { useRef, useState } from "react"

import { RobotsService } from "@/client"
import { useWebRTC } from "@/hooks/useWebRTC"

interface ConnectRobotProps {
  robotId: string
}

function ConnectRobot({ robotId }: ConnectRobotProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isConnected, setIsConnected] = useState(false)
  const { data: robot } = useQuery({
    queryKey: ["robots", robotId],
    queryFn: () => RobotsService.readRobot({ robotId }),
  })

  const { connect, disconnect, sendMessage } = useWebRTC("user1", robotId)

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isConnected) return

    switch (e.key) {
      case "ArrowUp":
        sendMessage({ type: "move", direction: "forward" })
        break
      case "ArrowDown":
        sendMessage({ type: "move", direction: "backward" })
        break
      case "ArrowLeft":
        sendMessage({ type: "move", direction: "left" })
        break
      case "ArrowRight":
        sendMessage({ type: "move", direction: "right" })
        break
      case " ":
        sendMessage({ type: "stop" })
        break
    }
  }

  const startConnection = async () => {
    try {
      await connect()
      setIsConnected(true)
    } catch (error) {
      console.error("Connection failed:", error)
    }
  }

  const handleDisconnect = () => {
    disconnect()
    setIsConnected(false)
  }

  if (!robot) {
    return (
      <Box textAlign="center" py={8}>
        <Text fontSize="lg" color="gray.500">
          로봇 정보를 불러올 수 없습니다.
        </Text>
      </Box>
    )
  }

  return (
    <Box
      className="flex flex-col items-center gap-4 p-4"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <Box position="relative" w="full" maxW="2xl">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full rounded-lg shadow-lg"
        />
        <Box position="absolute" bottom={4} left={4}>
          <Text
            px={2}
            py={1}
            rounded="md"
            fontSize="sm"
            bg={isConnected ? "green.500" : "red.500"}
            color="white"
          >
            {isConnected ? "연결됨" : "연결 끊김"}
          </Text>
        </Box>
      </Box>

      <Flex gap={4}>
        <Button
          onClick={startConnection}
          isDisabled={isConnected}
          colorScheme="blue"
        >
          연결
        </Button>
        <Button
          onClick={handleDisconnect}
          isDisabled={!isConnected}
          colorScheme="red"
        >
          연결 해제
        </Button>
      </Flex>

      <Box textAlign="center" color="gray.600">
        <Text>방향키를 사용하여 로봇을 제어하세요</Text>
        <Text>스페이스바를 눌러 정지하세요</Text>
      </Box>
    </Box>
  )
}

export default ConnectRobot 