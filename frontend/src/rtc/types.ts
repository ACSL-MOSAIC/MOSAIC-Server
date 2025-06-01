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

export type DataChannelType = 'position' | 'remote_control' | 'go2_low_state'

export interface DataChannelConfig {
  label: DataChannelType
  onOpen?: () => void
  onMessage?: (data: any) => void
  onClose?: () => void
  onError?: (error: Event) => void
}

export interface Go2LowState {
  imu: {
    roll: number
    pitch: number
    yaw: number
    quaternion: [number, number, number, number]
  }
  motors: {
    [key: string]: {
      q: number
      dq: number
      tau_est: number
    }
  }
  footForce: {
    [key: string]: number
  }
}

export interface DataChannelHandlers {
  onPositionUpdate?: (data: PositionData) => void
  onConnectionCheck?: (data: ConnectionCheckData) => void
  onControlCommand?: (data: ControlData) => void
  onGo2LowState?: (data: Go2LowState) => void
} 