// Types
export interface ControlData {
  direction: 'up' | 'down' | 'left' | 'right'
}

export interface ConnectionCheckData {
  type: 'connection_check'
  user_id: string
  robot_id: string
}

// Channel Configuration
interface ControlChannelConfig {
  onOpen?: () => void
  onClose?: () => void
  onError?: (error: Event) => void
  onConnectionCheck?: (data: ConnectionCheckData) => void
  onControlCommand?: (data: ControlData) => void
}

// Channel Creation
export const createControlChannel = (
  peer: RTCPeerConnection
): RTCDataChannel => {
  const channel = peer.createDataChannel('remote_control')
  return channel
}

// Message Senders
export const sendControlCommand = (
  channel: RTCDataChannel,
  direction: ControlData['direction']
): void => {
  if (channel.readyState !== 'open') {
    console.error('Control channel is not open')
    return
  }

  channel.send(JSON.stringify({ direction }))
}

export const sendConnectionCheck = (
  channel: RTCDataChannel,
  userId: string,
  robotId: string
): void => {
  if (channel.readyState !== 'open') {
    console.error('Control channel is not open')
    return
  }

  const data: ConnectionCheckData = {
    type: 'connection_check',
    user_id: userId,
    robot_id: robotId
  }

  channel.send(JSON.stringify(data))
}

// Event Handlers
export const handleConnectionCheck = (
  data: ConnectionCheckData,
  lastConnectionCheckTime: { current: number | null }
): void => {
  lastConnectionCheckTime.current = Date.now()
}

export const handleControlCommand = (
  data: ControlData,
  onDirectionChange: (direction: ControlData['direction']) => void
): void => {
  onDirectionChange(data.direction)
} 