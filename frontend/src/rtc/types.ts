export interface PositionData {
  x: number
  y: number
  theta: number
}

export interface ControlData {
  direction: 'up' | 'down' | 'left' | 'right'
}

export interface ConnectionCheckData {
  type: 'connection_check'
  user_id: string
  robot_id: string
}

export type DataChannelType = 'position' | 'remote_control'

export interface DataChannelConfig {
  label: DataChannelType
  onOpen?: () => void
  onMessage?: (data: any) => void
  onClose?: () => void
  onError?: (error: Event) => void
}

export interface DataChannelHandlers {
  onPositionUpdate?: (data: PositionData) => void
  onConnectionCheck?: (data: ConnectionCheckData) => void
  onControlCommand?: (data: ControlData) => void
} 