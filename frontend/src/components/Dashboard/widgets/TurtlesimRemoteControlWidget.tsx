import { useEffect, useState } from 'react'
import { Box, Button, Grid, Text, VStack } from '@chakra-ui/react'
import { TurtlesimRemoteControlStore } from '@/dashboard/store/turtlesim-remote-control.store'
import { ParsedTurtlesimRemoteControl } from '@/dashboard/parser/turtlesim-remote-control'
import { WebRTCConnection } from '@/rtc/webrtc-connection'

interface TurtlesimRemoteControlWidgetProps {
  robotId: string
  store: TurtlesimRemoteControlStore
  dataType?: string
}

export function TurtlesimRemoteControlWidget({ robotId, store, dataType }: TurtlesimRemoteControlWidgetProps) {
  const [lastCommand, setLastCommand] = useState<ParsedTurtlesimRemoteControl | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    // WebRTC 연결 상태 확인
    const checkConnectionStatus = () => {
      // Store에서 WebRTC 연결 객체 가져오기
      const dataChannel = store.getDataChannel()
      if (dataChannel && dataChannel.readyState === 'open') {
        setIsConnected(true)
      } else {
        setIsConnected(false)
      }
    }

    // 초기 상태 확인
    checkConnectionStatus()

    // 주기적으로 연결 상태 확인 (1초마다)
    const interval = setInterval(checkConnectionStatus, 1000)

    // 명령 전송 후 상태 업데이트를 위한 구독
    const unsubscribe = store.subscribe((data: ParsedTurtlesimRemoteControl) => {
      setLastCommand(data)
    })

    return () => {
      clearInterval(interval)
      unsubscribe()
    }
  }, [store])

  const handleDirectionClick = (direction: 'up' | 'down' | 'left' | 'right') => {
    store.sendCommand(direction)
  }

  return (
    <VStack gap={3} align="stretch">
      <Text fontSize="sm" fontWeight="bold" color={isConnected ? 'green.500' : 'gray.500'}>
        Turtlesim Remote Control {isConnected ? '(Connected)' : '(Disconnected)'}
      </Text>
      
      <Box border="1px solid" borderColor="gray.200" borderRadius="md" p={3}>
        <Grid templateColumns="repeat(3, 1fr)" gap={2} maxW="200px" mx="auto">
          {/* 빈 공간 */}
          <Box />
          
          {/* 위쪽 버튼 */}
          <Button
            size="sm"
            colorScheme="blue"
            onClick={() => handleDirectionClick('up')}
            disabled={!isConnected}
          >
            ↑
          </Button>
          
          {/* 빈 공간 */}
          <Box />
          
          {/* 왼쪽 버튼 */}
          <Button
            size="sm"
            colorScheme="blue"
            onClick={() => handleDirectionClick('left')}
            disabled={!isConnected}
          >
            ←
          </Button>
          
          {/* 중앙 (빈 공간) */}
          <Box />
          
          {/* 오른쪽 버튼 */}
          <Button
            size="sm"
            colorScheme="blue"
            onClick={() => handleDirectionClick('right')}
            disabled={!isConnected}
          >
            →
          </Button>
          
          {/* 빈 공간 */}
          <Box />
          
          {/* 아래쪽 버튼 */}
          <Button
            size="sm"
            colorScheme="blue"
            onClick={() => handleDirectionClick('down')}
            disabled={!isConnected}
          >
            ↓
          </Button>
          
          {/* 빈 공간 */}
          <Box />
        </Grid>
      </Box>
      
      {lastCommand && (
        <VStack gap={1} align="stretch">
          <Text fontSize="xs" color="gray.600">
            Last command: {lastCommand.direction.toUpperCase()}
          </Text>
          <Text fontSize="xs" color="gray.500">
            Sent: {new Date(lastCommand.timestamp).toLocaleTimeString()}
          </Text>
        </VStack>
      )}
    </VStack>
  )
} 