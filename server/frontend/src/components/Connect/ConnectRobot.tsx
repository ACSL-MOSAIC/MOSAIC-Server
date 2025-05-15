import { Box, Button, Flex, Text, Icon, Grid, GridItem } from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { useRef } from "react"
import { RobotsService } from "@/client"
import { useWebRTC } from "@/hooks/useWebRTC"
import useAuth from "@/hooks/useAuth"
import { IoArrowUp, IoArrowDown, IoArrowBack, IoArrowForward } from "react-icons/io5"

interface ConnectRobotProps {
  robotId: string
}

function ConnectRobot({ robotId }: ConnectRobotProps) {
  console.log("ConnectRobot component rendered with robotId:", robotId)
  const videoRef = useRef<HTMLVideoElement>(null)
  const { user } = useAuth()
  const { data: robot } = useQuery({
    queryKey: ["robots", robotId],
    queryFn: () => RobotsService.readRobot({ id: robotId }),
  })

  console.log("Robot data:", robot)

  const { isConnected, startConnection, disconnect, fps, sendControlData } = useWebRTC(user?.id || "", robotId, videoRef)

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isConnected) return

    let direction: 'up' | 'down' | 'left' | 'right' | null = null
    switch (e.key) {
      case "ArrowUp":
        direction = 'up'
        break
      case "ArrowDown":
        direction = 'down'
        break
      case "ArrowLeft":
        direction = 'left'
        break
      case "ArrowRight":
        direction = 'right'
        break
      default:
        return
    }

    if (direction) {
      sendControlData(direction)
    }
  }

  const handleDirectionClick = (direction: 'up' | 'down' | 'left' | 'right') => {
    if (!isConnected) return
    sendControlData(direction)
  }

  if (!robot) {
    console.log("Robot data is not available")
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
          <Text
            px={2}
            py={1}
            rounded="md"
            fontSize="sm"
            bg="black"
            color="white"
            mt={1}
          >
            {fps} fps
          </Text>
        </Box>
      </Box>

      <Flex gap={4}>
        <Button
          onClick={startConnection}
          disabled={isConnected}
          colorScheme="blue"
        >
          연결
        </Button>
        <Button
          onClick={disconnect}
          disabled={!isConnected}
          colorScheme="red"
        >
          연결 해제
        </Button>
      </Flex>

      <Box textAlign="center" color="gray.600">
        <Text mb={4}>방향키를 사용하여 로봇을 제어하세요</Text>
        
        <Grid templateColumns="repeat(3, 1fr)" gap={2} w="200px">
          <GridItem colStart={2}>
            <Button
              aria-label="위로 이동"
              size="lg"
              onClick={() => handleDirectionClick('up')}
              disabled={!isConnected}
              colorScheme="blue"
            >
              <Icon as={IoArrowUp} boxSize={6} />
            </Button>
          </GridItem>
          <GridItem colStart={1} rowStart={2}>
            <Button
              aria-label="왼쪽으로 이동"
              size="lg"
              onClick={() => handleDirectionClick('left')}
              disabled={!isConnected}
              colorScheme="blue"
            >
              <Icon as={IoArrowBack} boxSize={6} />
            </Button>
          </GridItem>
          <GridItem colStart={2} rowStart={2}>
            <Button
              aria-label="아래로 이동"
              size="lg"
              onClick={() => handleDirectionClick('down')}
              disabled={!isConnected}
              colorScheme="blue"
            >
              <Icon as={IoArrowDown} boxSize={6} />
            </Button>
          </GridItem>
          <GridItem colStart={3} rowStart={2}>
            <Button
              aria-label="오른쪽으로 이동"
              size="lg"
              onClick={() => handleDirectionClick('right')}
              disabled={!isConnected}
              colorScheme="blue"
            >
              <Icon as={IoArrowForward} boxSize={6} />
            </Button>
          </GridItem>
        </Grid>
      </Box>
    </Box>
  )
}

export default ConnectRobot 