import useAuth from "@/hooks/useAuth"
import {getBackendWsUrl} from "@/utils/envs.ts"
import {type ReactNode, useEffect, useRef, useState} from "react"
import {
  type RobotInfo,
  WebSocketContext,
  type WebSocketMessage,
} from "./WebSocketContext"

export function WebSocketProvider({children}: { children: ReactNode }) {
  const {user, logout: authLogout} = useAuth()
  const [robots, setRobots] = useState<RobotInfo[]>([])
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>()
  const refreshIntervalRef = useRef<NodeJS.Timeout>()
  const isConnectingRef = useRef(false)
  const messageHandlersRef = useRef<Map<string, ((data: any) => void)[]>>(
    new Map(),
  )

  const logout = async () => {
    console.log("로그아웃 처리 중...")
    disconnect()
    await authLogout()
  }

  const connectWebSocket = () => {
    if (isConnectingRef.current || !user?.id) return
    const accessToken = localStorage.getItem("access_token")
    if (!accessToken) return

    isConnectingRef.current = true

    const wsURL = getBackendWsUrl()
    const websocket = new WebSocket(`${wsURL}/ws/user`)

    websocket.onopen = () => {
      console.log("WebSocket 연결됨")
      isConnectingRef.current = false
      wsRef.current = websocket

      // 30초마다 ping 메시지 전송
      refreshIntervalRef.current = setInterval(() => {
        if (websocket.readyState === WebSocket.OPEN) {
          websocket.send(JSON.stringify({type: "ping"}))
        }
      }, 30000)
    }

    websocket.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data)
        // console.log("WebSocket 메시지 수신:", data)

        if (data.type === "force_logout") {
          console.log("강제 로그아웃 메시지 수신:", data.message)
          await logout()
          return
        }

        if (data.type === "authorize.req") {
          sendMessage({
            type: "authorize",
            data: {
              accessToken: accessToken,
            },
          })
        }

        // 로봇 리스트 처리
        if (data.type === "robot_list") {
          setRobots(data.robots)
        }

        // 등록된 메시지 핸들러 호출
        const handlers = messageHandlersRef.current.get(data.type)
        if (handlers) {
          handlers.forEach((handler) => handler(data))
        }
      } catch (error) {
        console.error("WebSocket 메시지 처리 중 오류:", error)
      }
    }

    websocket.onerror = (error) => {
      console.error("WebSocket 에러:", error)
      isConnectingRef.current = false
    }

    websocket.onclose = (event) => {
      console.log("WebSocket 연결 종료:", event.code, event.reason)
      isConnectingRef.current = false
      wsRef.current = null

      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current)
      }

      if (event.code !== 1000 && event.code !== 1006) {
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log("WebSocket 재연결 시도...")
          connectWebSocket()
        }, 5000)
      }
    }
  }

  const sendMessage = (message: WebSocketMessage) => {
    const ws = wsRef.current
    if (ws?.readyState === WebSocket.OPEN) {
      console.log("WebSocket 메시지 전송:", message)
      ws.send(JSON.stringify(message))
    } else {
      console.error("WebSocket이 연결되어 있지 않습니다., ", ws?.readyState)
    }
  }

  const onMessage = <T extends WebSocketMessage>(
    type: T["type"],
    callback: (data: T) => void,
  ) => {
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

  const disconnect = () => {
    if (wsRef.current) {
      wsRef.current.close(1000, "User logged out")
    }
  }

  useEffect(() => {
    if (user?.id && !wsRef.current && !isConnectingRef.current) {
      connectWebSocket()
    } else {
      disconnect()
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close(1000, "Component unmounting")
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
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current)
      }
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current)
      }
    }
  }, [wsRef.current?.readyState])

  return (
    <WebSocketContext.Provider
      value={{robots, sendMessage, onMessage, disconnect}}
    >
      {children}
    </WebSocketContext.Provider>
  )
}
