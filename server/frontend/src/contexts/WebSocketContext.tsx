import { createContext, useContext, useEffect, useState, useRef, ReactNode } from "react"
import useAuth from "@/hooks/useAuth"

interface RobotInfo {
  robot_id: string
  state: string
}

interface WebSocketContextType {
  robots: RobotInfo[]
  sendMessage: (message: any) => void
}

const WebSocketContext = createContext<WebSocketContextType | null>(null)

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [robots, setRobots] = useState<RobotInfo[]>([])
  const [ws, setWs] = useState<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>()
  const refreshIntervalRef = useRef<NodeJS.Timeout>()
  const isConnectingRef = useRef(false)

  const connectWebSocket = () => {
    if (!user?.id || isConnectingRef.current) return

    isConnectingRef.current = true
    console.log("WebSocket 연결 시도...")

    const websocket = new WebSocket(`ws://localhost:8000/ws/user?user_id=${user.id}`)

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
      const data = JSON.parse(event.data)
      if (data.type === "robot_list") {
        setRobots(data.robots)
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
      
      // 연결이 끊어지면 interval 정리
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current)
      }

      // 정상적인 종료가 아닌 경우에만 재연결 시도
      if (event.code !== 1000) {
        // 5초마다 재연결 시도
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log("WebSocket 재연결 시도...")
          connectWebSocket()
        }, 5000)
      }
    }
  }

  const sendMessage = (message: any) => {
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

  // 10초마다 로봇 리스트 갱신
  useEffect(() => {
    if (ws?.readyState === WebSocket.OPEN) {
      // 기존 interval이 있다면 제거
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current)
      }
      
      // 10초마다 로봇 리스트 요청
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
    <WebSocketContext.Provider value={{ robots, sendMessage }}>
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