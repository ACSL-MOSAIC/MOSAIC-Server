import type {WsBaseMessage} from "@/contexts/ws.dto.ts"
import useAuth from "@/hooks/useAuth"
import {getBackendWsUrl} from "@/utils/envs.ts"
import {type ReactNode, useEffect, useRef} from "react"
import {
  type ExtractDataByType,
  type OnWsMessageType,
  type SendWsMessageType,
  WebSocketContext,
  type WsMessages,
} from "./WebSocketContext"

export function WebSocketProvider({children}: { children: ReactNode }) {
  const {user, logout: authLogout} = useAuth()
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>()
  const refreshIntervalRef = useRef<NodeJS.Timeout>()
  const isConnectingRef = useRef(false)
  const messageHandlersRef = useRef<
    Map<string, (data: any) => void | Promise<void>>
  >(new Map())

  const logout = async () => {
    console.log("로그아웃 처리 중...")
    disconnectWs()
    await authLogout()
  }

  const connectWebSocket = () => {
    if (isConnectingRef.current || !user?.id) return
    const accessToken = localStorage.getItem("access_token")
    if (!accessToken) return

    registerDefaultHandlers(accessToken)

    isConnectingRef.current = true

    const wsURL = getBackendWsUrl()
    const websocket = new WebSocket(`${wsURL}/ws/user`)

    websocket.onopen = () => {
      wsOnOpen(websocket)
    }
    websocket.onmessage = wsOnMessage
    websocket.onerror = wsOnError
    websocket.onclose = wsOnClose
  }

  const wsOnOpen = (websocket: WebSocket) => {
    console.log("WebSocket 연결됨")
    isConnectingRef.current = false
    wsRef.current = websocket

    refreshIntervalRef.current = setInterval(() => {
      if (websocket.readyState === WebSocket.OPEN) {
        websocket.send(JSON.stringify({type: "ping"}))
      }
    }, 30000)
  }

  const wsOnMessage = async (event: MessageEvent<string>) => {
    try {
      const message: WsBaseMessage = JSON.parse(event.data)
      // console.log("WebSocket 메시지 수신:", message)

      const handler = messageHandlersRef.current.get(message.type)
      if (handler) {
        const result = handler(message.data)
        if (result instanceof Promise) {
          await result
        }
      }
    } catch (error) {
      console.error("WebSocket 메시지 처리 중 오류:", error)
    }
  }

  const wsOnError = (error: Event) => {
    console.error("WebSocket 에러:", error)
    isConnectingRef.current = false
  }

  const wsOnClose = (event: CloseEvent) => {
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

  const registerDefaultHandlers = (accessToken: string) => {
    onWsMessage("ping.ping", (data) => {
      sendWsMessage({
        type: "ping.pong",
        data: {
          pingId: data.pingId,
        },
      })
    })

    onWsMessage("authorize.req", () => {
      sendWsMessage({
        type: "authorize",
        data: {
          accessToken: accessToken,
        },
      })
    })

    onWsMessage("authorize.res", (resultCode) => {
      if (resultCode === 100) {
        console.log("Authorization completed")
      } else {
        console.error("Authorization failed", resultCode)
        disconnectWs()
      }
    })

    onWsMessage("force_logout", async (data) => {
      console.log("강제 로그아웃 메시지 수신:", data.message)
      await logout()
    })
  }

  const sendWsMessage: SendWsMessageType = (message: WsMessages) => {
    const ws = wsRef.current
    if (ws?.readyState === WebSocket.OPEN) {
      console.log("WebSocket 메시지 전송:", message)
      ws.send(JSON.stringify(message))
    } else {
      console.error("WebSocket이 연결되어 있지 않습니다., ", ws?.readyState)
    }
  }

  const onWsMessage: OnWsMessageType = <T extends WsMessages["type"]>(
    type: T,
    callback: (data: ExtractDataByType<T>) => void | Promise<void>,
  ) => {
    const handler = messageHandlersRef.current.get(type)
    if (!handler) {
      messageHandlersRef.current.set(
        type,
        callback as (data: any) => void | Promise<void>,
      )
    }

    return () => {
      messageHandlersRef.current.delete(type)
    }
  }

  const disconnectWs = () => {
    if (wsRef.current) {
      wsRef.current.close(1000, "User logged out")
    }
  }

  useEffect(() => {
    if (user?.id && !wsRef.current && !isConnectingRef.current) {
      connectWebSocket()
    } else {
      disconnectWs()
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
      value={{sendWsMessage, onWsMessage, disconnectWs}}
    >
      {children}
    </WebSocketContext.Provider>
  )
}
