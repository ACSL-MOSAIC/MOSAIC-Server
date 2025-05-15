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

// Channel Setup
export const setupPositionChannel = (
  channel: RTCDataChannel,
  config: PositionChannelConfig
): void => {
  // Canvas 초기화
  const canvas = config.canvas
  canvas.width = CANVAS_SIZE
  canvas.height = CANVAS_SIZE
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  channel.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data) as PositionData
      handlePositionUpdate(data, canvas, config.positionElement)
      config.onPositionUpdate?.(data)
    } catch (error) {
      console.error('Error parsing position data:', error)
    }
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

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // Draw point
  const canvasX = data.x * SCALE
  const canvasY = data.y * SCALE

  ctx.beginPath()
  ctx.arc(canvasX, CANVAS_SIZE - canvasY, 5, 0, Math.PI * 2)
  ctx.fillStyle = 'red'
  ctx.fill()
  ctx.closePath()

  // Draw direction arrow
  const arrowLength = 30
  const arrowEndX = canvasX + Math.cos(-data.theta) * arrowLength
  const arrowEndY = CANVAS_SIZE - canvasY + Math.sin(-data.theta) * arrowLength

  ctx.beginPath()
  ctx.moveTo(canvasX, CANVAS_SIZE - canvasY)
  ctx.lineTo(arrowEndX, arrowEndY)
  ctx.strokeStyle = 'blue'
  ctx.lineWidth = 2
  ctx.stroke()
  ctx.closePath()

  // Update position text
  positionElement.textContent = JSON.stringify(data, null, 2)
} 