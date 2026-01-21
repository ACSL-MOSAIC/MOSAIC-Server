import type {ParsedTurtlesimPosition} from "@/dashboard/parser/turtlesim-position"
import type {TurtlesimPositionStore} from "@/dashboard/store/data-channel-store/readonly/turtlesim-position.store"
import {useRobotMapping} from "@/hooks/useRobotMapping.ts"
import {useEffect, useRef, useState} from "react"
import {WidgetFrame} from "../WidgetFrame"

interface TurtlesimPositionWidgetProps {
  robotId: string
  store: TurtlesimPositionStore
  dataType?: string
  onRemove?: () => void
}

export function TurtlesimPositionWidget({
                                          robotId,
                                          store,
                                          onRemove,
                                        }: TurtlesimPositionWidgetProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const [position, setPosition] = useState<ParsedTurtlesimPosition | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [velocity, setVelocity] = useState({linear: 0, angular: 0})
  const [lastPosition, setLastPosition] =
    useState<ParsedTurtlesimPosition | null>(null)

  const {getRobotName} = useRobotMapping()

  useEffect(() => {
    const unsubscribe = store.subscribe((data: ParsedTurtlesimPosition) => {
      if (lastPosition) {
        const dt = (data.timestamp - lastPosition.timestamp) / 1000 // seconds
        if (dt > 0) {
          const dx = data.x - lastPosition.x
          const dy = data.y - lastPosition.y
          const linearVel = Math.sqrt(dx * dx + dy * dy) / dt
          const angularVel = (data.theta - lastPosition.theta) / dt
          setVelocity({linear: linearVel, angular: angularVel})
        }
      }
      setLastPosition(position)
      setPosition(data)
      setIsConnected(true)
    })

    return unsubscribe
  }, [store, position, lastPosition])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // 캔버스 크기 설정 함수
    const setCanvasSize = () => {
      const rect = canvas.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1

      // 실제 캔버스 크기 (픽셀)
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr

      // CSS 크기
      canvas.style.width = `${rect.width}px`
      canvas.style.height = `${rect.height}px`

      // 컨텍스트 스케일 조정
      ctx.scale(dpr, dpr)

      return {width: rect.width, height: rect.height}
    }

    // 초기 크기 설정
    const {width: canvasWidth, height: canvasHeight} = setCanvasSize()
    const centerX = canvasWidth / 2
    const centerY = canvasHeight / 2

    // 리사이즈 이벤트 리스너
    const handleResize = () => {
      setCanvasSize()
    }

    window.addEventListener("resize", handleResize)

    // 애니메이션 함수
    const animate = () => {
      // 캔버스 초기화
      ctx.clearRect(0, 0, canvasWidth, canvasHeight)

      // 배경 그라데이션
      const gradient = ctx.createLinearGradient(0, 0, canvasWidth, canvasHeight)
      gradient.addColorStop(0, "#f7fafc")
      gradient.addColorStop(1, "#edf2f7")
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvasWidth, canvasHeight)

      // 격자 그리기 (고정된 크기)
      ctx.strokeStyle = "#e2e8f0"
      ctx.lineWidth = 0.5
      const gridSize = Math.max(20, Math.min(canvasWidth, canvasHeight) / 30) // 최소 20px, 최대 캔버스 크기의 1/30

      for (let x = 0; x <= canvasWidth; x += gridSize) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, canvasHeight)
        ctx.stroke()
      }

      for (let y = 0; y <= canvasHeight; y += gridSize) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(canvasWidth, y)
        ctx.stroke()
      }

      // 중앙 십자선
      ctx.strokeStyle = "#cbd5e0"
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(centerX, 0)
      ctx.lineTo(centerX, canvasHeight)
      ctx.moveTo(0, centerY)
      ctx.lineTo(canvasWidth, centerY)
      ctx.stroke()

      if (position) {
        // 좌표 변환 (turtlesim 좌표계를 캔버스 좌표계로)
        const scale = Math.min(canvasWidth, canvasHeight) / 12 // turtlesim은 0-11 좌표계
        const canvasX = centerX + (position.x - 5.5) * scale // 중앙을 0으로
        const canvasY = centerY - (position.y - 5.5) * scale // Y축 반전

        // 궤적 그리기 (최근 50개 포인트)
        if (store.data.length > 1) {
          const recentPositions = store.data.slice(-50)
          ctx.strokeStyle = "#3182ce"
          ctx.lineWidth = 2
          ctx.beginPath()

          recentPositions.forEach(
            (pos: ParsedTurtlesimPosition, index: number) => {
              const x = centerX + (pos.x - 5.5) * scale
              const y = centerY - (pos.y - 5.5) * scale
              if (index === 0) {
                ctx.moveTo(x, y)
              } else {
                ctx.lineTo(x, y)
              }
            },
          )
          ctx.stroke()
        }

        // 로봇 그림자
        ctx.beginPath()
        ctx.arc(canvasX + 2, canvasY + 2, 12, 0, Math.PI * 2)
        ctx.fillStyle = "rgba(0, 0, 0, 0.1)"
        ctx.fill()

        // 로봇 본체 (그라데이션)
        const robotGradient = ctx.createRadialGradient(
          canvasX,
          canvasY,
          0,
          canvasX,
          canvasY,
          10,
        )
        robotGradient.addColorStop(0, "#4299e1")
        robotGradient.addColorStop(1, "#3182ce")

        ctx.beginPath()
        ctx.arc(canvasX, canvasY, 10, 0, Math.PI * 2)
        ctx.fillStyle = robotGradient
        ctx.fill()

        // 로봇 테두리
        ctx.beginPath()
        ctx.arc(canvasX, canvasY, 10, 0, Math.PI * 2)
        ctx.strokeStyle = "#2b6cb0"
        ctx.lineWidth = 2
        ctx.stroke()

        // 방향 표시 (화살표)
        const arrowLength = 15
        const arrowEndX = canvasX + Math.cos(-position.theta) * arrowLength
        const arrowEndY = canvasY + Math.sin(-position.theta) * arrowLength

        // 화살표 몸통
        ctx.beginPath()
        ctx.moveTo(canvasX, canvasY)
        ctx.lineTo(arrowEndX, arrowEndY)
        ctx.strokeStyle = "#e53e3e"
        ctx.lineWidth = 3
        ctx.stroke()

        // 화살표 머리
        const headLength = 6
        const angle = Math.atan2(arrowEndY - canvasY, arrowEndX - canvasX)
        const headAngle1 = angle - Math.PI / 6
        const headAngle2 = angle + Math.PI / 6

        ctx.beginPath()
        ctx.moveTo(arrowEndX, arrowEndY)
        ctx.lineTo(
          arrowEndX - headLength * Math.cos(headAngle1),
          arrowEndY - headLength * Math.sin(headAngle1),
        )
        ctx.moveTo(arrowEndX, arrowEndY)
        ctx.lineTo(
          arrowEndX - headLength * Math.cos(headAngle2),
          arrowEndY - headLength * Math.sin(headAngle2),
        )
        ctx.strokeStyle = "#e53e3e"
        ctx.lineWidth = 3
        ctx.stroke()

        // 로봇 이름 표시
        ctx.fillStyle = "#2d3748"
        ctx.font =
          'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        ctx.textAlign = "center"
        ctx.fillText(getRobotName(robotId), canvasX, canvasY - 20)
      }

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      window.removeEventListener("resize", handleResize)
    }
  }, [position, robotId, store])

  // Footer info for connected state
  const footerInfo = position
    ? [
      {
        label: "Position",
        value: `X: ${position.x.toFixed(2)} | Y: ${position.y.toFixed(2)}`,
      },
      {
        label: "Orientation",
        value: `θ: ${((position.theta * 180) / Math.PI).toFixed(1)}°`,
      },
      {
        label: "Velocity",
        value: `Linear: ${velocity.linear.toFixed(2)} m/s | Angular: ${velocity.angular.toFixed(2)} rad/s`,
      },
      {
        label: "Last Update",
        value: new Date(position.timestamp).toLocaleTimeString(),
      },
    ]
    : [
      {
        label: "Position",
        value: "--",
      },
      {
        label: "Orientation",
        value: "--",
      },
      {
        label: "Velocity",
        value: "--",
      },
    ]

  return (
    <WidgetFrame
      title="Turtlesim Position"
      robot_id={robotId}
      isConnected={isConnected && store.getChannelInfo().state === "open"}
      footerInfo={footerInfo}
      footerMessage={position ? undefined : "Waiting for connection..."}
      onRemove={onRemove}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: "100%",
          borderRadius: "8px",
          cursor: "crosshair",
        }}
      />
    </WidgetFrame>
  )
}
