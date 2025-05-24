import { Box, Button, Text, Icon, Grid } from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { useRef } from "react"
import { RobotsService } from "@/client"
import { useMultiRobot } from "@/hooks/useMultiRobot"
import useAuth from "@/hooks/useAuth"
import { IoArrowUp, IoArrowDown, IoArrowBack, IoArrowForward, IoVideocam, IoLocation, IoCompass } from "react-icons/io5"

interface ConnectRobotProps {
  robotId: string
}

function ConnectRobot({ robotId }: ConnectRobotProps) {
  if (!robotId) {
    return (
      <Box textAlign="center" py={8}>
        <Text fontSize="lg" color="gray.500">
          로봇 ID가 지정되지 않았습니다.
        </Text>
      </Box>
    )
  }

  const robotIdList = robotId.split(',')
  const { user } = useAuth()
  
  // 각 로봇별 ref 생성
  const videoRefs = robotIdList.reduce((acc, id) => ({
    ...acc,
    [id]: useRef<HTMLVideoElement>(null)
  }), {} as { [key: string]: React.RefObject<HTMLVideoElement> })

  const canvasRefs = robotIdList.reduce((acc, id) => ({
    ...acc,
    [id]: useRef<HTMLCanvasElement>(null)
  }), {} as { [key: string]: React.RefObject<HTMLCanvasElement> })

  const positionElementRefs = robotIdList.reduce((acc, id) => ({
    ...acc,
    [id]: useRef<HTMLDivElement>(null)
  }), {} as { [key: string]: React.RefObject<HTMLDivElement> })

  // 각 로봇 정보 조회
  const robotQueries = robotIdList.map(id => 
    useQuery({
      queryKey: ["robots", id],
      queryFn: () => RobotsService.readRobot({ id }),
    })
  )

  const { connections, connectToRobot, disconnectFromRobot, sendControlData } = useMultiRobot({
    userId: user?.id || "",
    videoRefs,
    canvasRefs,
    positionElementRefs
  })

  const handleKeyDown = (e: React.KeyboardEvent) => {
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
      // 모든 연결된 로봇에 명령 전송
      robotIdList.forEach(robotId => {
        if (connections[robotId]?.isConnected) {
          sendControlData(robotId, direction)
        }
      })
    }
  }

  const handleDirectionClick = (direction: 'up' | 'down' | 'left' | 'right') => {
    // 모든 연결된 로봇에 명령 전송
    robotIdList.forEach(robotId => {
      if (connections[robotId]?.isConnected) {
        sendControlData(robotId, direction)
      }
    })
  }

  const handleConnect = async () => {
    for (const robotId of robotIdList) {
      if (!connections[robotId]) {
        await connectToRobot(robotId)
      }
    }
  }

  const handleDisconnect = () => {
    for (const robotId of robotIdList) {
      if (connections[robotId]) {
        disconnectFromRobot(robotId)
      }
    }
  }

  if (robotQueries.some(query => !query.data)) {
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
        <Grid templateColumns={`repeat(${robotIdList.length}, 1fr)`} gap={6}>
          {robotIdList.map(robotId => {
            const robot = robotQueries.find(q => q.data?.id === robotId)?.data
            const connection = connections[robotId]
            
            return (
              <Box key={robotId} className="bg-white rounded-2xl shadow-xl p-6">
                <div className="flex items-center gap-2 text-gray-600 mb-2">
                  <Icon as={IoVideocam} boxSize={5} />
                  <span className="font-medium">스트림 상태</span>
                </div>
                <div className="text-2xl font-bold mb-1">
                  {connection?.fps ?? 0} FPS
                </div>
                <div className="text-sm text-green-500">
                  {connection?.isConnected ? "실시간 스트리밍 중" : "연결 필요"}
                </div>
              </Box>
            )
          })}
        </Grid>

        {/* 비디오 스트림 섹션 */}
        <Grid templateColumns={`repeat(${robotIdList.length}, 1fr)`} gap={6}>
          {robotIdList.map(robotId => (
            <Box key={robotId} className="relative rounded-2xl overflow-hidden shadow-xl bg-white">
              <video
                ref={videoRefs[robotId]}
                autoPlay
                playsInline
                className="w-full aspect-video object-cover"
              />
            </Box>
          ))}
        </Grid>

        {/* 컨트롤 패널 섹션 */}
        <Grid templateColumns="repeat(2, 1fr)" gap={6}>
          {/* 위치 표시 섹션 */}
          <Grid templateColumns={`repeat(${robotIdList.length}, 1fr)`} gap={6}>
            {robotIdList.map(robotId => (
              <Box key={robotId} className="bg-white rounded-2xl shadow-xl p-6">
                <Text className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <Icon as={IoLocation} boxSize={5} />
                  로봇 위치 ({robotId})
                </Text>
                <Box className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden">
                  <canvas
                    ref={canvasRefs[robotId]}
                    className="absolute inset-0 w-full h-full"
                  />
                </Box>
                <Text
                  ref={positionElementRefs[robotId]}
                  className="mt-4 font-mono text-sm text-gray-600 text-center"
                />
              </Box>
            ))}
          </Grid>

          {/* 컨트롤 섹션 */}
          <Box className="space-y-6">
            {/* 연결 상태 */}
            <Box className="bg-white rounded-2xl shadow-xl p-6">
              <Text className="text-lg font-semibold text-gray-700 mb-4">
                연결 상태
              </Text>
              <Box className="flex gap-4">
                <Button
                  onClick={handleConnect}
                  colorScheme="blue"
                  size="lg"
                  className="flex-1 h-12 font-medium"
                >
                  모든 로봇 연결
                </Button>
                <Button
                  onClick={handleDisconnect}
                  colorScheme="red"
                  size="lg"
                  className="flex-1 h-12 font-medium"
                >
                  모든 로봇 연결 해제
                </Button>
              </Box>
            </Box>

            {/* 방향 제어 */}
            <Box className="bg-white rounded-2xl shadow-xl p-6">
              <Text className="text-lg font-semibold text-gray-700 mb-2">
                로봇 제어
              </Text>
              <Text className="text-sm text-gray-500 mb-6">
                방향키를 사용하여 모든 로봇을 동시에 제어하세요
              </Text>
              
              <Grid templateColumns="repeat(3, 1fr)" gap={3} className="w-64 mx-auto">
                <div className="col-start-2">
                  <Button
                    aria-label="위로 이동"
                    size="lg"
                    onClick={() => handleDirectionClick('up')}
                    colorScheme="blue"
                    className="w-full h-16 rounded-xl hover:scale-105 transition-transform"
                  >
                    <Icon as={IoArrowUp} boxSize={8} />
                  </Button>
                </div>
                <div className="col-start-1 row-start-2">
                  <Button
                    aria-label="왼쪽으로 이동"
                    size="lg"
                    onClick={() => handleDirectionClick('left')}
                    colorScheme="blue"
                    className="w-full h-16 rounded-xl hover:scale-105 transition-transform"
                  >
                    <Icon as={IoArrowBack} boxSize={8} />
                  </Button>
                </div>
                <div className="col-start-2 row-start-2">
                  <Button
                    aria-label="아래로 이동"
                    size="lg"
                    onClick={() => handleDirectionClick('down')}
                    colorScheme="blue"
                    className="w-full h-16 rounded-xl hover:scale-105 transition-transform"
                  >
                    <Icon as={IoArrowDown} boxSize={8} />
                  </Button>
                </div>
                <div className="col-start-3 row-start-2">
                  <Button
                    aria-label="오른쪽으로 이동"
                    size="lg"
                    onClick={() => handleDirectionClick('right')}
                    colorScheme="blue"
                    className="w-full h-16 rounded-xl hover:scale-105 transition-transform"
                  >
                    <Icon as={IoArrowForward} boxSize={8} />
                  </Button>
                </div>
              </Grid>
            </Box>
          </Box>
        </Grid>
      </Box>
    </Box>
  )
}

export default ConnectRobot 