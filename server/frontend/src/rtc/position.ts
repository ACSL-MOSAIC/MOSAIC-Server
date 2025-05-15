// Types
export interface PositionData {
  x: number
  y: number
  theta: number
}

// Channel Configuration
interface PositionChannelConfig {
  onPositionUpdate?: (data: PositionData) => void
}

// Channel Setup
export const setupPositionChannel = (
  channel: RTCDataChannel,
  config: PositionChannelConfig
): void => {
  channel.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data) as PositionData
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

  const canvasSize = 300
  const MAX_COORDINATE = 12
  const scale = canvasSize / MAX_COORDINATE

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // Draw point
  const canvasX = data.x * scale
  const canvasY = data.y * scale

  ctx.beginPath()
  ctx.arc(canvasX, canvasSize - canvasY, 5, 0, Math.PI * 2)
  ctx.fillStyle = 'red'
  ctx.fill()
  ctx.closePath()

  // Draw direction arrow
  const arrowLength = 30
  const arrowEndX = canvasX + Math.cos(-data.theta) * arrowLength
  const arrowEndY = canvasSize - canvasY + Math.sin(-data.theta) * arrowLength

  ctx.beginPath()
  ctx.moveTo(canvasX, canvasSize - canvasY)
  ctx.lineTo(arrowEndX, arrowEndY)
  ctx.strokeStyle = 'blue'
  ctx.lineWidth = 2
  ctx.stroke()
  ctx.closePath()

  // Update position text
  positionElement.textContent = JSON.stringify(data, null, 2)
} 