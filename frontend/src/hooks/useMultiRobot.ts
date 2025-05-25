import { useEffect, useState } from "react"
import { useWebSocket } from "@/contexts/WebSocketContext"
import { WebRTCConnection, WebRTCConnectionConfig } from "@/rtc/WebRTCConnection"
import useCustomToast from "@/hooks/useCustomToast"

export interface RobotConnection {
  robotId: string
  isConnected: boolean
  fps: number
  connection: WebRTCConnection
}

export interface UseMultiRobotConfig {
  userId: string
  videoRefs: { [key: string]: React.RefObject<HTMLVideoElement> }
  canvasRefs: { [key: string]: React.RefObject<HTMLCanvasElement> }
  positionElementRefs: { [key: string]: React.RefObject<HTMLElement> }
}

export function useMultiRobot(config: UseMultiRobotConfig) {
  const { sendMessage, onMessage } = useWebSocket()
  const [connections, setConnections] = useState<{ [key: string]: RobotConnection }>({})
  const { showErrorToast } = useCustomToast()

  const handleConnectionStateChange = (robotId: string, isConnected: boolean) => {
    setConnections(prev => ({
      ...prev,
      [robotId]: {
        ...prev[robotId],
        isConnected
      }
    }))
  }

  const handleFpsChange = (robotId: string, fps: number) => {
    setConnections(prev => ({
      ...prev,
      [robotId]: {
        ...prev[robotId],
        fps
      }
    }))
  }

  const handleError = (robotId: string, error: Error) => {
    showErrorToast(`로봇 ${robotId} 연결 오류: ${error.message}`)
  }

  const connectToRobot = async (robotId: string) => {
    try {
      const connectionConfig: WebRTCConnectionConfig = {
        userId: config.userId,
        robotId,
        videoRef: config.videoRefs[robotId],
        canvasRef: config.canvasRefs[robotId],
        positionElementRef: config.positionElementRefs[robotId],
        onConnectionStateChange: (isConnected) => handleConnectionStateChange(robotId, isConnected),
        onFpsChange: (fps) => handleFpsChange(robotId, fps),
        onError: (error) => handleError(robotId, error)
      }

      const connection = new WebRTCConnection(connectionConfig)
      const offer = await connection.startConnection()
      if (!offer.sdp) {
        throw new Error("SDP offer 생성 실패")
      }

      setConnections(prev => ({
        ...prev,
        [robotId]: {
          robotId,
          isConnected: false,
          fps: 0,
          connection
        }
      }))

      // SDP offer를 서버로 전송
      sendMessage({
        type: "send_sdp_offer",
        user_id: config.userId,
        robot_id: robotId,
        sdp_offer: offer.sdp
      })
    } catch (error) {
      showErrorToast(`로봇 ${robotId} 연결 실패: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  const disconnectFromRobot = (robotId: string) => {
    const connection = connections[robotId]?.connection
    if (connection) {
      connection.disconnect()
      setConnections(prev => {
        const newConnections = { ...prev }
        delete newConnections[robotId]
        return newConnections
      })
    }
  }

  const sendControlData = (robotId: string, direction: 'up' | 'down' | 'left' | 'right') => {
    const connection = connections[robotId]?.connection
    if (connection) {
      connection.sendControlData(direction)
    }
  }

  useEffect(() => {
    const handleWebSocketMessage = (message: any) => {
      const { type, user_id, robot_id, sdp_answer, ice_candidate } = message

      if (user_id !== config.userId) return

      const connection = connections[robot_id]?.connection
      if (!connection) return

      switch (type) {
        case "receive_sdp_answer":
          if (sdp_answer) {
            connection.setRemoteDescription(new RTCSessionDescription({
              type: 'answer',
              sdp: sdp_answer
            }))
          }
          break

        case "receive_ice_candidate":
          if (ice_candidate) {
            connection.addIceCandidate(new RTCIceCandidate(ice_candidate))
          }
          break
      }
    }

    onMessage("receive_sdp_answer", handleWebSocketMessage)
    onMessage("receive_ice_candidate", handleWebSocketMessage)
  }, [config.userId, connections, onMessage])

  return {
    connections,
    connectToRobot,
    disconnectFromRobot,
    sendControlData
  }
} 