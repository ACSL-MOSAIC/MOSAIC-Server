import { useEffect, useRef, useState } from 'react'
import { Box, Text, VStack } from '@chakra-ui/react'
import { TurtlesimPositionStore } from '@/dashboard/store/turtlesim-position.store'
import { ParsedTurtlesimPosition } from '@/dashboard/parser/turtlesim-position'

interface TurtlesimPositionWidgetProps {
  robotId: string
  store: TurtlesimPositionStore
  dataType?: string
}

export function TurtlesimPositionWidget({ robotId, store, dataType }: TurtlesimPositionWidgetProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [position, setPosition] = useState<ParsedTurtlesimPosition | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    const unsubscribe = store.subscribe((data: ParsedTurtlesimPosition) => {
      setPosition(data)
      setIsConnected(true)
    })

    return unsubscribe
  }, [store])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !position) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const canvasSize = 200
    canvas.width = canvasSize
    canvas.height = canvasSize

    const MAX_COORDINATE = 12
    const scale = canvasSize / MAX_COORDINATE

    // 캔버스 초기화
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // 배경 그리기
    ctx.fillStyle = '#f0f0f0'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // 격자 그리기
    ctx.strokeStyle = '#ddd'
    ctx.lineWidth = 1
    for (let i = 0; i <= MAX_COORDINATE; i++) {
      const pos = i * scale
      ctx.beginPath()
      ctx.moveTo(pos, 0)
      ctx.lineTo(pos, canvas.height)
      ctx.stroke()
      
      ctx.beginPath()
      ctx.moveTo(0, pos)
      ctx.lineTo(canvas.width, pos)
      ctx.stroke()
    }

    // 로봇 위치 그리기
    const canvasX = position.x * scale
    const canvasY = position.y * scale

    // 로봇 점 그리기
    ctx.beginPath()
    ctx.arc(canvasX, canvasSize - canvasY, 8, 0, Math.PI * 2)
    ctx.fillStyle = '#3182ce'
    ctx.fill()
    ctx.closePath()

    // 방향 화살표 그리기
    const arrowLength = 25
    const arrowEndX = canvasX + Math.cos(-position.theta) * arrowLength
    const arrowEndY = canvasSize - canvasY + Math.sin(-position.theta) * arrowLength

    ctx.beginPath()
    ctx.moveTo(canvasX, canvasSize - canvasY)
    ctx.lineTo(arrowEndX, arrowEndY)
    ctx.strokeStyle = '#e53e3e'
    ctx.lineWidth = 3
    ctx.stroke()
    ctx.closePath()

    // 로봇 ID 표시
    ctx.fillStyle = '#2d3748'
    ctx.font = '12px Arial'
    ctx.fillText(robotId, canvasX + 10, canvasSize - canvasY - 10)

  }, [position, robotId])

  return (
    <VStack gap={2} align="stretch">
      <Text fontSize="sm" fontWeight="bold" color={isConnected ? 'green.500' : 'gray.500'}>
        Turtlesim Position {isConnected ? '(Connected)' : '(Disconnected)'}
      </Text>
      
      <Box border="1px solid" borderColor="gray.200" borderRadius="md" p={2}>
        <canvas
          ref={canvasRef}
          style={{
            width: '100%',
            height: '200px',
            border: '1px solid #e2e8f0',
            borderRadius: '4px'
          }}
        />
      </Box>
      
      {position && (
        <VStack gap={1} align="stretch">
          <Text fontSize="xs" color="gray.600">
            X: {position.x.toFixed(2)} | Y: {position.y.toFixed(2)} | θ: {(position.theta * 180 / Math.PI).toFixed(1)}°
          </Text>
          <Text fontSize="xs" color="gray.500">
            Last update: {new Date(position.timestamp).toLocaleTimeString()}
          </Text>
        </VStack>
      )}
    </VStack>
  )
} 