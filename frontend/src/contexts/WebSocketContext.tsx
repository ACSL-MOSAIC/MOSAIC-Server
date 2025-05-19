import { createContext, useContext, useEffect, useState, useRef, ReactNode } from "react"
import useAuth from "@/hooks/useAuth"

// 로봇 정보 타입
interface RobotInfo {
  robot_id: string
  state: string
}

// 기본 메시지 타입
interface WebSocketBaseMessage {
  type: string
  user_id?: string
  robot_id?: string
}

// 에러 메시지 타입
interface WebSocketErrorMessage extends WebSocketBaseMessage {
  type: "error"
  error: string
  detail?: string
}

// 로봇 리스트 요청/응답 타입
interface GetRobotListMessage extends WebSocketBaseMessage {
  type: "get_robot_list"
}

interface RobotListMessage extends WebSocketBaseMessage {
  type: "robot_list"
  robots: RobotInfo[]
}

// SDP Offer/Answer 타입
interface SendSdpOfferMessage extends WebSocketBaseMessage {
  type: "send_sdp_offer"
  robot_id: string
  sdp_offer: string
}

interface ReceiveSdpOfferMessage extends WebSocketBaseMessage {
  type: "receive_sdp_offer"
  user_id: string
  robot_id: string
  sdp_offer: string
}

interface SendSdpAnswerMessage extends WebSocketBaseMessage {
  type: "send_sdp_answer"
  user_id: string
  robot_id: string
  sdp_answer: string
}

interface ReceiveSdpAnswerMessage extends WebSocketBaseMessage {
  type: "receive_sdp_answer"
  user_id: string
  robot_id: string
  sdp_answer: string
}

// ICE Candidate 타입
interface SendIceCandidateMessage extends WebSocketBaseMessage {
  type: "send_ice_candidate"
  robot_id: string
  ice_candidate: {
    candidate: string
    sdpMid: string | null
    sdpMLineIndex: number | null
  }
}

interface ReceiveIceCandidateMessage extends WebSocketBaseMessage {
  type: "receive_ice_candidate"
  user_id: string
  robot_id: string
  ice_candidate: {
    candidate: string
    sdpMid: string | null
    sdpMLineIndex: number | null
  }
}

// 모든 메시지 타입을 유니온 타입으로 정의
type WebSocketMessage =
  | GetRobotListMessage
  | RobotListMessage
  | SendSdpOfferMessage
  | ReceiveSdpOfferMessage
  | SendSdpAnswerMessage
  | ReceiveSdpAnswerMessage
  | SendIceCandidateMessage
  | ReceiveIceCandidateMessage
  | WebSocketErrorMessage

interface WebSocketContextType {
  robots: RobotInfo[]
  sendMessage: (message: WebSocketMessage) => void
  onMessage: <T extends WebSocketMessage>(type: T["type"], callback: (data: T) => void) => void
}

const WebSocketContext = createContext<WebSocketContextType | null>(null)

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [robots, setRobots] = useState<RobotInfo[]>([])
  const [ws, setWs] = useState<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>()
  const refreshIntervalRef = useRef<NodeJS.Timeout>()
  const isConnectingRef = useRef(false)
  const messageHandlersRef = useRef<Map<string, ((data: any) => void)[]>>(new Map())

  const connectWebSocket = () => {
    if (!user?.id || isConnectingRef.current) return

    isConnectingRef.current = true
    console.log("WebSocket 연결 시도...")

    const websocket = new WebSocket(`wss://api.acslgcs.com/ws/user?user_id=${user.id}`)

    websocket.onopen = () => {
      console.log("WebSocket 연결됨")
      isConnectingRef.current = false
      setWs(websocket)
      // 연결 즉시 로봇 리스트 요청
      sendMessage({
        type: "get_robot_list"
      })
    }

    websocket.onmessage = (event) => {
      console.log("WebSocket 메시지 수신:", event.data)
      const data = JSON.parse(event.data) as WebSocketMessage
      
      // 로봇 리스트 처리
      if (data.type === "robot_list") {
        setRobots(data.robots)
      }

      // 등록된 메시지 핸들러 호출
      const handlers = messageHandlersRef.current.get(data.type)
      if (handlers) {
        handlers.forEach(handler => handler(data))
      }
    }

    websocket.onerror = (error) => {
      console.error("WebSocket 에러:", error)
      isConnectingRef.current = false
    }

    websocket.onclose = (event) => {
      console.log("WebSocket 연결 종료:", event.code, event.reason)
      isConnectingRef.current = false
      setWs(null)
      
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current)
      }

      if (event.code !== 1000) {
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log("WebSocket 재연결 시도...")
          connectWebSocket()
        }, 5000)
      }
    }
  }

  const sendMessage = (message: WebSocketMessage) => {
    if (ws?.readyState === WebSocket.OPEN) {
      console.log("WebSocket 메시지 전송:", message)
      const messageWithUserId = {
        ...message,
        user_id: user?.id
      }
      ws.send(JSON.stringify(messageWithUserId))
    } else {
      console.error("WebSocket이 연결되어 있지 않습니다.")
    }
  }

  const onMessage = <T extends WebSocketMessage>(type: T["type"], callback: (data: T) => void) => {
    const handlers = messageHandlersRef.current.get(type) || []
    handlers.push(callback as (data: any) => void)
    messageHandlersRef.current.set(type, handlers)

    return () => {
      const handlers = messageHandlersRef.current.get(type) || []
      const index = handlers.indexOf(callback as (data: any) => void)
      if (index > -1) {
        handlers.splice(index, 1)
        messageHandlersRef.current.set(type, handlers)
      }
    }
  }

  useEffect(() => {
    if (user?.id) {
      connectWebSocket()
    }

    return () => {
      if (ws) {
        ws.close(1000, "Component unmounting")
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current)
      }
    }
  }, [user?.id])

  useEffect(() => {
    if (ws?.readyState === WebSocket.OPEN) {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current)
      }
      
      refreshIntervalRef.current = setInterval(() => {
        console.log("10초마다 로봇 리스트 갱신")
        sendMessage({
          type: "get_robot_list"
        })
      }, 10000)
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current)
      }
    }
  }, [ws?.readyState])

  return (
    <WebSocketContext.Provider value={{ robots, sendMessage, onMessage }}>
      {children}
    </WebSocketContext.Provider>
  )
}

export function useWebSocket() {
  const context = useContext(WebSocketContext)
  if (!context) {
    throw new Error("useWebSocket must be used within a WebSocketProvider")
  }
  return context
} 