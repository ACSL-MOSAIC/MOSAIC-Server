// Types
export interface PositionData {
  x: number
  y: number
  theta: number
}

// Channel Configuration
interface PositionChannelConfig {
  onPositionUpdate?: (data: PositionData) => void
  canvas: HTMLCanvasElement
  positionElement: HTMLElement
}

// Canvas Configuration
const CANVAS_SIZE = 300
const MAX_COORDINATE = 12
const SCALE = CANVAS_SIZE / MAX_COORDINATE
const VIEWPORT_THRESHOLD = CANVAS_SIZE * 0.75 // 화면의 3/4 지점

// Colors
const COLORS = {
  background: '#f8fafc',
  grid: '#e2e8f0',
  robot: '#3b82f6',
  direction: '#1e40af',
  text: '#64748b',
  axis: '#94a3b8',
  coordinates: '#475569'
}

// Viewport state
let viewportOffset = { x: 0, y: 0 }

// Channel Setup
export const setupPositionChannel = (
  channel: RTCDataChannel,
  config: PositionChannelConfig
): void => {
  const canvas = config.canvas
  canvas.width = CANVAS_SIZE
  canvas.height = CANVAS_SIZE
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // 초기 그리드 그리기
  drawGrid(ctx)

  channel.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data) as PositionData
      console.log('Received position data:', data)
      handlePositionUpdate(data, canvas, config.positionElement)
      config.onPositionUpdate?.(data)
    } catch (error) {
      console.error('Error parsing position data:', error)
    }
  }
}

// Grid Drawing
const drawGrid = (ctx: CanvasRenderingContext2D) => {
  ctx.fillStyle = COLORS.background
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)

  // 그리드 라인
  ctx.strokeStyle = COLORS.grid
  ctx.lineWidth = 1

  // 수직선
  for (let x = -viewportOffset.x % SCALE; x <= CANVAS_SIZE; x += SCALE) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, CANVAS_SIZE)
    ctx.stroke()
  }

  // 수평선
  for (let y = -viewportOffset.y % SCALE; y <= CANVAS_SIZE; y += SCALE) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(CANVAS_SIZE, y)
    ctx.stroke()
  }

  // 축 그리기
  ctx.strokeStyle = COLORS.axis
  ctx.lineWidth = 2

  // X축
  ctx.beginPath()
  ctx.moveTo(0, CANVAS_SIZE - viewportOffset.y)
  ctx.lineTo(CANVAS_SIZE, CANVAS_SIZE - viewportOffset.y)
  ctx .stroke()

  // Y축
  ctx.beginPath()
  ctx.moveTo(0 - viewportOffset.x, 0)
  ctx.lineTo(0 - viewportOffset.x, CANVAS_SIZE)
  ctx.stroke()

  // 좌표 표시
  ctx.fillStyle = COLORS.coordinates
  ctx.font = '10px sans-serif'
  ctx.textAlign = 'center'
  
  // X축 좌표
  const startX = Math.floor(viewportOffset.x / SCALE)
  const endX = startX + Math.ceil(CANVAS_SIZE / SCALE)
  for (let x = startX; x <= endX; x++) {
    const canvasX = x * SCALE - viewportOffset.x
    ctx.fillText(x.toString(), canvasX, CANVAS_SIZE - viewportOffset.y + 15)
  }

  // Y축 좌표
  const startY = Math.floor(viewportOffset.y / SCALE)
  const endY = startY + Math.ceil(CANVAS_SIZE / SCALE)
  for (let y = startY; y <= endY; y++) {
    const canvasY = CANVAS_SIZE - (y * SCALE - viewportOffset.y)
    ctx.fillText(y.toString(), -viewportOffset.x - 15, canvasY)
  }
}

// Position Update Handler
export const handlePositionUpdate = (
  data: PositionData,
  canvas: HTMLCanvasElement,
  positionElement: HTMLElement
): void => {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // 좌표 변환 (0,0이 왼쪽 아래에서 시작)
  const canvasX = data.x * SCALE
  const canvasY = CANVAS_SIZE - data.y * SCALE

  // 뷰포트 업데이트
  const centerX = CANVAS_SIZE / 2
  const centerY = CANVAS_SIZE / 2

  // 로봇이 화면의 3/4 지점을 넘어가면 뷰포트 이동
  if (Math.abs(canvasX - centerX) > VIEWPORT_THRESHOLD) {
    viewportOffset.x = canvasX - centerX
  }
  if (Math.abs(canvasY - centerY) > VIEWPORT_THRESHOLD) {
    viewportOffset.y = canvasY - centerY
  }

  // Clear canvas and redraw grid
  drawGrid(ctx)

  // Draw robot position
  const robotX = canvasX - viewportOffset.x
  const robotY = canvasY - viewportOffset.y

  ctx.beginPath()
  ctx.arc(robotX, robotY, 8, 0, Math.PI * 2)
  ctx.fillStyle = COLORS.robot
  ctx.fill()
  ctx.strokeStyle = 'white'
  ctx.lineWidth = 2
  ctx.stroke()
  ctx.closePath()

  // Draw direction arrow
  const arrowLength = 25
  const arrowEndX = robotX + Math.cos(-data.theta) * arrowLength
  const arrowEndY = robotY + Math.sin(-data.theta) * arrowLength

  ctx.beginPath()
  ctx.moveTo(robotX, robotY)
  ctx.lineTo(arrowEndX, arrowEndY)
  ctx.strokeStyle = COLORS.direction
  ctx.lineWidth = 3
  ctx.stroke()

  // Draw arrow head
  const headLength = 10
  const angle = Math.atan2(arrowEndY - robotY, arrowEndX - robotX)
  ctx.beginPath()
  ctx.moveTo(arrowEndX, arrowEndY)
  ctx.lineTo(
    arrowEndX - headLength * Math.cos(angle - Math.PI / 6),
    arrowEndY - headLength * Math.sin(angle - Math.PI / 6)
  )
  ctx.lineTo(
    arrowEndX - headLength * Math.cos(angle + Math.PI / 6),
    arrowEndY - headLength * Math.sin(angle + Math.PI / 6)
  )
  ctx.closePath()
  ctx.fillStyle = COLORS.direction
  ctx.fill()

  // Update position text with formatted coordinates
  const formattedData = {
    x: data.x.toFixed(2),
    y: data.y.toFixed(2),
    theta: (data.theta * 180 / Math.PI).toFixed(1) + '°'
  }
  positionElement.textContent = `위치: (${formattedData.x}, ${formattedData.y}) 방향: ${formattedData.theta}`
} 