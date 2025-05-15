import { Box, Button, Text, Icon, Grid, GridItem } from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { useRef } from "react"
import { RobotsService } from "@/client"
import { useWebRTC } from "@/hooks/useWebRTC"
import useAuth from "@/hooks/useAuth"
import { IoArrowUp, IoArrowDown, IoArrowBack, IoArrowForward, IoVideocam, IoLocation, IoCompass } from "react-icons/io5"

interface ConnectRobotProps {
  robotId: string
}

function ConnectRobot({ robotId }: ConnectRobotProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const positionElementRef = useRef<HTMLDivElement>(null)
  const { user } = useAuth()
  const { data: robot } = useQuery({
    queryKey: ["robots", robotId],
    queryFn: () => RobotsService.readRobot({ id: robotId }),
  })

  const { isConnected, startConnection, disconnect, fps, sendControlData } = useWebRTC(
    user?.id || "",
    robotId,
    videoRef,
    canvasRef,
    positionElementRef
  )

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
    return (
      <Box textAlign="center" py={8}>
        <Text fontSize="lg" color="gray.500">
          로봇 정보를 불러올 수 없습니다.
        </Text>
      </Box>
    )
  }

  return (
    <Box className="min-h-screen bg-gray-50 p-6">
      <Box className="max-w-7xl mx-auto space-y-6">
        {/* 상태 대시보드 */}
        <Grid templateColumns="repeat(3, 1fr)" gap={6}>
          <Box className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center gap-2 text-gray-600 mb-2">
              <Icon as={IoVideocam} boxSize={5} />
              <span className="font-medium">스트림 상태</span>
            </div>
            <div className="text-2xl font-bold mb-1">
              {fps} FPS
            </div>
            <div className="text-sm text-green-500">
              실시간 스트리밍 중
            </div>
          </Box>
          <Box className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center gap-2 text-gray-600 mb-2">
              <Icon as={IoLocation} boxSize={5} />
              <span className="font-medium">연결 상태</span>
            </div>
            <div className="text-2xl font-bold mb-1">
              {isConnected ? "연결됨" : "연결 끊김"}
            </div>
            <div className={`text-sm ${isConnected ? "text-green-500" : "text-red-500"}`}>
              {isConnected ? "안정적인 연결" : "연결 필요"}
            </div>
          </Box>
          <Box className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center gap-2 text-gray-600 mb-2">
              <Icon as={IoCompass} boxSize={5} />
              <span className="font-medium">로봇 상태</span>
            </div>
            <div className="text-2xl font-bold mb-1">
              {robot.name}
            </div>
            <div className="text-sm text-blue-500">
              {robot.status}
            </div>
          </Box>
        </Grid>

        {/* 비디오 스트림 섹션 */}
        <Box className="relative rounded-2xl overflow-hidden shadow-xl bg-white">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full aspect-video object-cover"
          />
        </Box>

        {/* 컨트롤 패널 섹션 */}
        <Grid templateColumns="repeat(2, 1fr)" gap={6}>
          {/* 위치 표시 섹션 */}
          <Box className="bg-white rounded-2xl shadow-xl p-6">
            <Text className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <Icon as={IoLocation} boxSize={5} />
              로봇 위치
            </Text>
            <Box className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden">
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full"
              />
            </Box>
            <Text
              ref={positionElementRef}
              className="mt-4 font-mono text-sm text-gray-600 text-center"
            />
          </Box>

          {/* 컨트롤 섹션 */}
          <Box className="space-y-6">
            {/* 연결 상태 */}
            <Box className="bg-white rounded-2xl shadow-xl p-6">
              <Text className="text-lg font-semibold text-gray-700 mb-4">
                연결 상태
              </Text>
              <Box className="flex gap-4">
                <Button
                  onClick={startConnection}
                  disabled={isConnected}
                  colorScheme="blue"
                  size="lg"
                  className="flex-1 h-12 font-medium"
                >
                  연결
                </Button>
                <Button
                  onClick={disconnect}
                  disabled={!isConnected}
                  colorScheme="red"
                  size="lg"
                  className="flex-1 h-12 font-medium"
                >
                  연결 해제
                </Button>
              </Box>
            </Box>

            {/* 방향 제어 */}
            <Box className="bg-white rounded-2xl shadow-xl p-6">
              <Text className="text-lg font-semibold text-gray-700 mb-2">
                로봇 제어
              </Text>
              <Text className="text-sm text-gray-500 mb-6">
                방향키를 사용하여 로봇을 제어하세요
              </Text>
              
              <Grid templateColumns="repeat(3, 1fr)" gap={3} className="w-64 mx-auto">
                <GridItem colStart={2}>
                  <Button
                    aria-label="위로 이동"
                    size="lg"
                    onClick={() => handleDirectionClick('up')}
                    disabled={!isConnected}
                    colorScheme="blue"
                    className="w-full h-16 rounded-xl hover:scale-105 transition-transform"
                  >
                    <Icon as={IoArrowUp} boxSize={8} />
                  </Button>
                </GridItem>
                <GridItem colStart={1} rowStart={2}>
                  <Button
                    aria-label="왼쪽으로 이동"
                    size="lg"
                    onClick={() => handleDirectionClick('left')}
                    disabled={!isConnected}
                    colorScheme="blue"
                    className="w-full h-16 rounded-xl hover:scale-105 transition-transform"
                  >
                    <Icon as={IoArrowBack} boxSize={8} />
                  </Button>
                </GridItem>
                <GridItem colStart={2} rowStart={2}>
                  <Button
                    aria-label="아래로 이동"
                    size="lg"
                    onClick={() => handleDirectionClick('down')}
                    disabled={!isConnected}
                    colorScheme="blue"
                    className="w-full h-16 rounded-xl hover:scale-105 transition-transform"
                  >
                    <Icon as={IoArrowDown} boxSize={8} />
                  </Button>
                </GridItem>
                <GridItem colStart={3} rowStart={2}>
                  <Button
                    aria-label="오른쪽으로 이동"
                    size="lg"
                    onClick={() => handleDirectionClick('right')}
                    disabled={!isConnected}
                    colorScheme="blue"
                    className="w-full h-16 rounded-xl hover:scale-105 transition-transform"
                  >
                    <Icon as={IoArrowForward} boxSize={8} />
                  </Button>
                </GridItem>
              </Grid>
            </Box>
          </Box>
        </Grid>
      </Box>
    </Box>
  )
}

export default ConnectRobot 