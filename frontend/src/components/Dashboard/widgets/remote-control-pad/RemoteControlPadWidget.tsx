import type {ParsedRemoteControl} from "@/dashboard/parser/remote-control-pad.ts"
import type {RemoteControlPadStore} from "@/dashboard/store/data-channel-store/writeonly/remote-control-pad.store.ts"
import {
  Badge,
  Box,
  Button,
  Grid,
  HStack,
  Text,
  VStack,
} from "@chakra-ui/react"
import {useEffect, useState} from "react"
import {WidgetFrame} from "../WidgetFrame"

interface RemoteControlPadWidgetProps {
  robotId: string
  store: RemoteControlPadStore
  dataType?: string
  onRemove?: () => void
}

// 방향 아이콘 컴포넌트
const DirectionIcon = ({direction}: { direction: string }) => {
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

export function RemoteControlPadWidget({
                                         robotId,
                                         store,
                                         onRemove,
                                       }: RemoteControlPadWidgetProps) {
  const [lastCommand, setLastCommand] = useState<ParsedRemoteControl | null>(
    null,
  )
  const [isConnected, setIsConnected] = useState(false)
  const [commandHistory, setCommandHistory] = useState<string[]>([])

  useEffect(() => {
    // WebRTC 연결 상태 확인
    const checkConnectionStatus = () => {
      const dataChannel = store.getDataChannel()
      // console.log("RemoteControlPadWidget - 데이터 채널 상태 확인:", {
      //   robotId,
      //   hasDataChannel: !!dataChannel,
      //   readyState: dataChannel?.readyState,
      //   label: dataChannel?.label,
      // })

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
      // console.log("RemoteControlPadWidget - 연결 상태 변경:", {
      //   connected,
      //   robotId,
      // })
      setIsConnected(connected)
    })

    // 명령 전송 후 상태 업데이트를 위한 구독
    const unsubscribeData = store.subscribe((data: ParsedRemoteControl) => {
      console.log("RemoteControlPadWidget - 데이터 수신:", data)
      setLastCommand(data)
      // 명령 히스토리에 추가 (최근 5개)
      setCommandHistory((prev) => {
        const newHistory = [...prev, data.direction]
        return newHistory.slice(-5)
      })
    })

    return () => {
      // console.log(`RemoteControlPadWidget - cleanup for robot ${robotId}`)
      unsubscribeConnection()
      unsubscribeData()
    }
  }, [store, robotId])

  const handleDirectionClick = (
    direction: "up" | "down" | "left" | "right" | "stop",
  ) => {
    const sent = store.sendCommand(direction)

    if (!sent) {
      console.warn(`명령 전송 실패: ${direction}`)
    }
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

  const DirectionButton = ({
                             direction,
                           }: { direction: "up" | "down" | "left" | "right" | "stop" }) => {
    return (
      <Button
        size="lg"
        colorScheme="teal"
        onClick={() => handleDirectionClick(direction)}
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
        <DirectionIcon direction={direction}/>
      </Button>
    )
  }

  return (
    <WidgetFrame
      title="Remote Control Pad"
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
            <Box/>

            {/* 위쪽 버튼 */}
            <DirectionButton direction="up"/>

            {/* 빈 공간 */}
            <Box/>

            {/* 왼쪽 버튼 */}
            <DirectionButton direction="left"/>

            {/* 중앙 */}
            <DirectionButton direction="stop"/>

            {/* 오른쪽 버튼 */}
            <DirectionButton direction="right"/>

            {/* 빈 공간 */}
            <Box/>

            {/* 아래쪽 버튼 */}
            <DirectionButton direction="down"/>

            {/* 빈 공간 */}
            <Box/>
          </Grid>
        </Box>
      </VStack>
    </WidgetFrame>
  )
}
