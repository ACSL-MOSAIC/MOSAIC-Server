import { useEffect, useRef, useState } from "react"
import { useWebSocket } from "@/contexts/WebSocketContext"
import useCustomToast from "@/hooks/useCustomToast"
import { WebRTCConnection as WebRTCConnectionClass, WebRTCConnectionConfig } from "@/rtc/WebRTCConnection"

interface WebRTCConnectionState {
  isConnected: boolean
  startConnection: () => Promise<void>
  disconnect: () => void
  peerConnection: RTCPeerConnection | null
  dataChannel: RTCDataChannel | null
  fps: number
  sendControlData: (direction: 'up' | 'down' | 'left' | 'right') => void
}

interface WebSocketMessage {
  type: string
  [key: string]: any
}

interface SendSdpOfferMessage extends WebSocketMessage {
  type: "send_sdp_offer"
  user_id: string
  robot_id: string
  sdp_offer: string
}

interface ReceiveSdpAnswerMessage extends WebSocketMessage {
  type: "receive_sdp_answer"
  user_id: string
  robot_id: string
  sdp_answer: string
}

interface SendIceCandidateMessage extends WebSocketMessage {
  type: "send_ice_candidate"
  user_id: string
  robot_id: string
  ice_candidate: {
    candidate: string
    sdpMid: string | null
    sdpMLineIndex: number | null
  }
}

interface ReceiveIceCandidateMessage extends WebSocketMessage {
  type: "receive_ice_candidate"
  user_id: string
  robot_id: string
  ice_candidate: {
    candidate: string
    sdpMid: string | null
    sdpMLineIndex: number | null
  }
}

export function useWebRTC(
  userId: string, 
  robotId: string, 
  videoRef: React.RefObject<HTMLVideoElement>,
  canvasRef: React.RefObject<HTMLCanvasElement>,
  positionElementRef: React.RefObject<HTMLElement>
): WebRTCConnectionState {
  const { sendMessage, onMessage } = useWebSocket()
  const [isConnected, setIsConnected] = useState(false)
  const [fps, setFps] = useState(0)
  const connectionRef = useRef<WebRTCConnectionClass | null>(null)
  const { showErrorToast } = useCustomToast()

  useEffect(() => {
    console.log("WebRTC 자동 연결 시도...")
    if (userId && robotId && !isConnected) {
      startConnection()
    }
  }, [userId, robotId])

  const startConnection = async () => {
    try {
      const config: WebRTCConnectionConfig = {
        userId,
        robotId,
        videoRef,
        canvasRef,
        positionElementRef,
        onConnectionStateChange: setIsConnected,
        onFpsChange: setFps,
        onError: (error) => showErrorToast(error.message)
      }

      const connection = new WebRTCConnectionClass(config)
      connectionRef.current = connection

      const peerConnection = connection.getPeerConnection()
      if (peerConnection) {
        peerConnection.onicecandidate = (event) => {
          if (event.candidate) {
            console.log("ICE Candidate 생성:", event.candidate)
            try {
              sendMessage({
                type: "send_ice_candidate",
                user_id: userId,
                robot_id: robotId,
                ice_candidate: {
                  candidate: event.candidate.candidate,
                  sdpMid: event.candidate.sdpMid,
                  sdpMLineIndex: event.candidate.sdpMLineIndex
                }
              })
            } catch (e) {
              console.error("ICE candidate 전송 실패 (WebSocket 연결 상태 확인 필요)", e)
            }
          }
        }
      }

      await connection.startConnection()
    } catch (error) {
      console.error("Failed to start WebRTC connection:", error)
      throw error
    }
  }

  const disconnect = () => {
    if (connectionRef.current) {
      connectionRef.current.disconnect()
      connectionRef.current = null
    }
  }

  const sendControlData = (direction: 'up' | 'down' | 'left' | 'right') => {
    if (connectionRef.current) {
      connectionRef.current.sendControlData(direction)
    }
  }

  useEffect(() => {
    const handleWebSocketMessage = (message: any) => {
      const { type, user_id, robot_id, sdp_answer, ice_candidate } = message

      if (user_id !== userId || robot_id !== robotId) return

      const connection = connectionRef.current
      if (!connection) return

      const peerConnection = connection.getPeerConnection()
      if (!peerConnection) return

      switch (type) {
        case "receive_sdp_answer":
          if (sdp_answer) {
            peerConnection.setRemoteDescription(new RTCSessionDescription({
              type: 'answer',
              sdp: sdp_answer
            }))
          }
          break

        case "receive_ice_candidate":
          if (ice_candidate) {
            peerConnection.addIceCandidate(new RTCIceCandidate(ice_candidate))
          }
          break
      }
    }

    onMessage("receive_sdp_answer", handleWebSocketMessage)
    onMessage("receive_ice_candidate", handleWebSocketMessage)
  }, [userId, robotId, onMessage])

  return {
    isConnected,
    startConnection,
    disconnect,
    peerConnection: connectionRef.current?.getPeerConnection() ?? null,
    dataChannel: connectionRef.current?.getDataChannel() ?? null,
    fps,
    sendControlData
  }
} 