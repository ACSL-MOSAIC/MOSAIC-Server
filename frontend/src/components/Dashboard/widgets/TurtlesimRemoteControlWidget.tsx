import type { ParsedTurtlesimRemoteControl } from "@/dashboard/parser/turtlesim-remote-control"
import type { TurtlesimRemoteControlStore } from "@/dashboard/store/data-channel-store/writeonly/turtlesim-remote-control.store"
import {
  Badge,
  Box,
  Button,
  Grid,
  HStack,
  Text,
  VStack,
} from "@chakra-ui/react"
import { useEffect, useState } from "react"
import { WidgetFrame } from "./WidgetFrame"

interface TurtlesimRemoteControlWidgetProps {
  robotId: string
  store: TurtlesimRemoteControlStore
  dataType?: string
  onRemove?: () => void
}

// 방향 아이콘 컴포넌트
const DirectionIcon = ({ direction }: { direction: string }) => {
  const getIcon = () => {
    switch (direction) {
      case "up":
        return "↑"
      case "down":
        return "↓"
      case "left":
        return "←"
      case "right":
        return "→"
      default:
        return "•"
    }
  }

  return (
    <Text fontSize="lg" fontWeight="bold">
      {getIcon()}
    </Text>
  )
}

export function TurtlesimRemoteControlWidget({
  robotId,
  store,
  onRemove,
}: TurtlesimRemoteControlWidgetProps) {
  const [lastCommand, setLastCommand] =
    useState<ParsedTurtlesimRemoteControl | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [commandHistory, setCommandHistory] = useState<string[]>([])

  useEffect(() => {
    // WebRTC 연결 상태 확인
    const checkConnectionStatus = () => {
      const dataChannel = store.getDataChannel()
      console.log("TurtlesimRemoteControlWidget - 데이터 채널 상태 확인:", {
        robotId,
        hasDataChannel: !!dataChannel,
        readyState: dataChannel?.readyState,
        label: dataChannel?.label,
      })

      if (dataChannel && dataChannel.readyState === "open") {
        setIsConnected(true)
      } else {
        setIsConnected(false)
      }
    }

    // 초기 상태 확인
    checkConnectionStatus()

    // 실시간 연결 상태 변경 리스너 등록
    const unsubscribeConnection = store.onConnectionStateChange((connected) => {
      console.log("TurtlesimRemoteControlWidget - 연결 상태 변경:", {
        connected,
        robotId,
      })
      setIsConnected(connected)
    })

    // 명령 전송 후 상태 업데이트를 위한 구독
    const unsubscribeData = store.subscribe(
      (data: ParsedTurtlesimRemoteControl) => {
        console.log("TurtlesimRemoteControlWidget - 데이터 수신:", data)
        setLastCommand(data)
        // 명령 히스토리에 추가 (최근 5개)
        setCommandHistory((prev) => {
          const newHistory = [...prev, data.direction]
          return newHistory.slice(-5)
        })
      },
    )

    return () => {
      console.log(`TurtlesimRemoteControlWidget - cleanup for robot ${robotId}`)
      unsubscribeConnection()
      unsubscribeData()
    }
  }, [store, robotId])

  const handleDirectionClick = (
    direction: "up" | "down" | "left" | "right",
  ) => {
    const sent = store.sendCommand(direction)

    if (!sent) {
      console.warn(`명령 전송 실패: ${direction}`)
    }
  }

  const getButtonColor = (direction: string) => {
    if (!isConnected) return "gray"

    // 마지막 명령이 이 방향이면 강조
    if (lastCommand?.direction === direction) {
      return "blue"
    }

    return "teal"
  }

  // Footer info
  const footerInfo = [
    ...(lastCommand
      ? [
          {
            label: "Last Command",
            value: lastCommand.direction.toUpperCase(),
          },
          {
            label: "Sent Time",
            value: new Date(lastCommand.timestamp).toLocaleTimeString(),
          },
        ]
      : []),
    ...(commandHistory.length > 0
      ? [
          {
            label: "History",
            value: (
              <HStack gap={1}>
                {commandHistory.map((cmd, index) => (
                  <Badge
                    key={index}
                    colorScheme="blue"
                    variant="subtle"
                    fontSize="xs"
                    px={1}
                  >
                    {cmd.toUpperCase()}
                  </Badge>
                ))}
              </HStack>
            ),
          },
        ]
      : []),
  ]

  return (
    <WidgetFrame
      title="Turtlesim Remote Control"
      robot_id={robotId}
      isConnected={isConnected}
      footerInfo={footerInfo}
      footerMessage={
        isConnected ? "Ready to send commands" : "Waiting for connection..."
      }
      padding="4"
      onRemove={onRemove}
    >
      {/* 컨트롤 패드 */}
      <VStack gap={4} align="center" h="100%" justify="center">
        <Text
          fontSize="xs"
          color="gray.600"
          fontWeight="medium"
          textAlign="center"
        >
          Control Pad
        </Text>

        <Box
          bg="gray.50"
          borderRadius="xl"
          p={4}
          boxShadow="inset 0 2px 4px rgba(0,0,0,0.1)"
          position="relative"
        >
          <Grid templateColumns="repeat(3, 1fr)" gap={2} maxW="180px" mx="auto">
            {/* 빈 공간 */}
            <Box />

            {/* 위쪽 버튼 */}
            <Button
              size="lg"
              colorScheme={getButtonColor("up")}
              onClick={() => handleDirectionClick("up")}
              disabled={!isConnected}
              borderRadius="md"
              boxShadow="md"
              _hover={{
                transform: "translateY(-2px)",
                boxShadow: "lg",
              }}
              _active={{
                transform: "translateY(0px)",
                boxShadow: "sm",
              }}
              transition="all 0.2s"
              minH="50px"
            >
              <DirectionIcon direction="up" />
            </Button>

            {/* 빈 공간 */}
            <Box />

            {/* 왼쪽 버튼 */}
            <Button
              size="lg"
              colorScheme={getButtonColor("left")}
              onClick={() => handleDirectionClick("left")}
              disabled={!isConnected}
              borderRadius="md"
              boxShadow="md"
              _hover={{
                transform: "translateX(-2px)",
                boxShadow: "lg",
              }}
              _active={{
                transform: "translateX(0px)",
                boxShadow: "sm",
              }}
              transition="all 0.2s"
              minH="50px"
            >
              <DirectionIcon direction="left" />
            </Button>

            {/* 중앙 (빈 공간) */}
            <Box />

            {/* 오른쪽 버튼 */}
            <Button
              size="lg"
              colorScheme={getButtonColor("right")}
              onClick={() => handleDirectionClick("right")}
              disabled={!isConnected}
              borderRadius="md"
              boxShadow="md"
              _hover={{
                transform: "translateX(2px)",
                boxShadow: "lg",
              }}
              _active={{
                transform: "translateX(0px)",
                boxShadow: "sm",
              }}
              transition="all 0.2s"
              minH="50px"
            >
              <DirectionIcon direction="right" />
            </Button>

            {/* 빈 공간 */}
            <Box />

            {/* 아래쪽 버튼 */}
            <Button
              size="lg"
              colorScheme={getButtonColor("down")}
              onClick={() => handleDirectionClick("down")}
              disabled={!isConnected}
              borderRadius="md"
              boxShadow="md"
              _hover={{
                transform: "translateY(2px)",
                boxShadow: "lg",
              }}
              _active={{
                transform: "translateY(0px)",
                boxShadow: "sm",
              }}
              transition="all 0.2s"
              minH="50px"
            >
              <DirectionIcon direction="down" />
            </Button>

            {/* 빈 공간 */}
            <Box />
          </Grid>
        </Box>
      </VStack>
    </WidgetFrame>
  )
}
