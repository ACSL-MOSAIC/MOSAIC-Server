import React, { useEffect, useState, useCallback } from "react"
import { useWebSocket } from "@/contexts/WebSocketContext"
import { WebRTCConnection, WebRTCConnectionConfig } from "@/rtc/WebRTCConnection"
import useCustomToast from "@/hooks/useCustomToast"

export interface RobotConnection {
  robotId: string
  isConnected: boolean
  fps: number
  connection: WebRTCConnection | null
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
  const connectionRefs = React.useRef<{ [key: string]: WebRTCConnection }>({})

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
    // showErrorToast(`로봇 ${robotId} 연결 오류: ${error.message}`)
    setConnections(prev => ({
      ...prev,
      [robotId]: {
        robotId,
        isConnected: false,
        fps: 0,
        connection: null
      }
    }))
  }

  const connectToRobot = useCallback(async (robotId: string) => {
    if (connections[robotId]?.isConnected) {
      console.log('이미 연결된 로봇입니다:', robotId)
      return
    }

    // 이미 연결 시도 중인 경우
    if (connectionRefs.current[robotId]) {
      console.log('이미 연결 시도 중인 로봇입니다:', robotId)
      return
    }

    try {
      console.log(`로봇 ${robotId} 연결 시작`)
      const connection = new WebRTCConnection({
        userId: config.userId,
        robotId,
        videoRef: config.videoRefs[robotId],
        canvasRef: config.canvasRefs[robotId],
        positionElementRef: config.positionElementRefs[robotId],
        onConnectionStateChange: (isConnected) => {
          console.log(`로봇 ${robotId} 연결 상태 변경:`, isConnected)
          handleConnectionStateChange(robotId, isConnected)
          if (isConnected) {
            sendMessage({
              type: "connected_robot_rtc",
              user_id: config.userId,
              robot_id: robotId
            })
          } else {
            sendMessage({
              type: "disconnected_robot_rtc",
              user_id: config.userId,
              robot_id: robotId
            })
          }
        },
        onFpsChange: (fps) => {
          handleFpsChange(robotId, fps)
        },
        onError: (error) => {
          console.error(`로봇 ${robotId} 연결 에러:`, error)
          handleError(robotId, error)
          // 에러 발생 시 연결 객체 정리
          delete connectionRefs.current[robotId]
        }
      })

      // 연결 객체를 먼저 저장
      connectionRefs.current[robotId] = connection

      const offer = await connection.startConnection()
      if (!offer.sdp) {
        throw new Error("SDP offer 생성 실패")
      }

      console.log(`로봇 ${robotId}의 SDP offer 생성 완료`)

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
      console.error(`로봇 ${robotId} 연결 실패:`, error)
      showErrorToast(`로봇 ${robotId} 연결 실패: ${error instanceof Error ? error.message : String(error)}`)
      handleError(robotId, error instanceof Error ? error : new Error(String(error)))
      // 에러 발생 시 연결 객체 정리
      delete connectionRefs.current[robotId]
    }
  }, [config.userId, config.videoRefs, config.canvasRefs, config.positionElementRefs, connections, sendMessage])

  const disconnectFromRobot = useCallback((robotId: string) => {
    const connection = connectionRefs.current[robotId]
    if (connection) {
      connection.disconnect()
      delete connectionRefs.current[robotId]
      setConnections(prev => ({
        ...prev,
        [robotId]: {
          robotId,
          isConnected: false,
          fps: 0,
          connection: null
        }
      }))
    }
  }, [])

  const sendControlData = (robotId: string, direction: 'up' | 'down' | 'left' | 'right') => {
    const connection = connections[robotId]?.connection
    if (connection && connections[robotId]?.isConnected) {
      connection.sendControlData(direction)
    } else {
      console.warn(`로봇 ${robotId}가 연결되어 있지 않습니다.`)
    }
  }

  useEffect(() => {
    const handleWebSocketMessage = async (message: any) => {
      const { type, user_id, robot_id, sdp_answer, ice_candidate } = message

      if (user_id !== config.userId) return

      const connection = connectionRefs.current[robot_id]
      if (!connection) {
        console.warn(`로봇 ${robot_id}에 대한 연결이 없습니다.`)
        return
      }

      try {
        switch (type) {
          case "receive_sdp_answer":
            if (sdp_answer) {
              console.log(`로봇 ${robot_id}의 SDP answer 수신`)
              const peerConnection = connection.getPeerConnection()
              if (peerConnection?.signalingState === 'have-local-offer') {
                await connection.setRemoteDescription(new RTCSessionDescription({
                  type: 'answer',
                  sdp: sdp_answer
                }))
              } else {
                console.warn(`로봇 ${robot_id}의 signaling state가 올바르지 않습니다:`, peerConnection?.signalingState)
              }
            }
            break

          case "receive_ice_candidate":
            if (ice_candidate) {
              console.log(`로봇 ${robot_id}의 ICE candidate 수신`)
              const peerConnection = connection.getPeerConnection()
              if (peerConnection) {
                await connection.addIceCandidate(new RTCIceCandidate(ice_candidate))
              } else {
                console.warn(`로봇 ${robot_id}의 peer connection이 없습니다.`)
              }
            }
            break
        }
      } catch (error) {
        console.error(`로봇 ${robot_id} 메시지 처리 중 에러:`, error)
        handleError(robot_id, error instanceof Error ? error : new Error(String(error)))
      }
    }

    onMessage("receive_sdp_answer", handleWebSocketMessage)
    onMessage("receive_ice_candidate", handleWebSocketMessage)

    return () => {
      // cleanup
      Object.keys(connectionRefs.current).forEach(robotId => {
        disconnectFromRobot(robotId)
      })
    }
  }, [config.userId, onMessage, disconnectFromRobot])

  return {
    connections,
    connectToRobot,
    disconnectFromRobot,
    sendControlData,
    connectionRefs: connectionRefs.current
  }
} 