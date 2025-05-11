import { useEffect, useRef, useCallback, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'

interface WebSocketMessage {
  type: string
  [key: string]: any
}

export const useWebRTC = (userId: string, robotId: string) => {
  const ws = useRef<WebSocket | null>(null)
  const peerConnection = useRef<RTCPeerConnection | null>(null)
  const dataChannel = useRef<RTCDataChannel | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const queryClient = useQueryClient()

  const createPeerConnection = useCallback(() => {
    const configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    }
    const pc = new RTCPeerConnection(configuration)

    // 데이터 채널 생성
    dataChannel.current = pc.createDataChannel('robot-control')
    dataChannel.current.onopen = () => {
      console.log('Data channel opened')
    }
    dataChannel.current.onclose = () => {
      console.log('Data channel closed')
    }

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendMessage({
          type: 'send_ice_candidate',
          user_id: userId,
          robot_id: robotId,
          ice_candidate: event.candidate,
        })
      }
    }

    pc.onconnectionstatechange = () => {
      setIsConnected(pc.connectionState === 'connected')
    }

    return pc
  }, [userId, robotId])

  const connect = useCallback(() => {
    if (!userId || !robotId) return

    const wsUrl = `ws://localhost:8000/api/v1/ws/user?user_id=${userId}`
    ws.current = new WebSocket(wsUrl)

    ws.current.onopen = () => {
      console.log('WebSocket Connected')
      // 연결 후 로봇 리스트 요청
      sendMessage({
        type: 'get_robot_list',
        user_id: userId,
      })
    }

    ws.current.onmessage = async (event) => {
      const data = JSON.parse(event.data)
      console.log('Received:', data)

      switch (data.type) {
        case 'robot_list':
          queryClient.setQueryData(['robots'], data.robots)
          break
        case 'receive_sdp_answer':
          if (peerConnection.current) {
            const answer = new RTCSessionDescription({
              type: 'answer',
              sdp: data.sdp_answer,
            })
            await peerConnection.current.setRemoteDescription(answer)
          }
          break
        case 'receive_ice_candidate':
          if (peerConnection.current) {
            await peerConnection.current.addIceCandidate(
              new RTCIceCandidate(data.ice_candidate)
            )
          }
          break
        case 'error':
          console.error('WebSocket Error:', data.error, data.detail)
          break
      }
    }

    ws.current.onerror = (error) => {
      console.error('WebSocket Error:', error)
    }

    ws.current.onclose = () => {
      console.log('WebSocket Disconnected')
      setTimeout(connect, 3000)
    }
  }, [userId, robotId, queryClient])

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message))
    } else {
      console.error('WebSocket is not connected')
    }
  }, [])

  const startConnection = useCallback(async () => {
    if (!peerConnection.current) {
      peerConnection.current = createPeerConnection()
    }

    try {
      const offer = await peerConnection.current.createOffer()
      await peerConnection.current.setLocalDescription(offer)

      sendMessage({
        type: 'send_sdp_offer',
        user_id: userId,
        robot_id: robotId,
        sdp_offer: offer.sdp,
      })
    } catch (error) {
      console.error('Error creating offer:', error)
    }
  }, [userId, robotId, createPeerConnection, sendMessage])

  const disconnect = useCallback(() => {
    if (peerConnection.current) {
      peerConnection.current.close()
      peerConnection.current = null
    }
    if (ws.current) {
      ws.current.close()
      ws.current = null
    }
    setIsConnected(false)
  }, [])

  useEffect(() => {
    connect()
    return () => {
      disconnect()
    }
  }, [connect, disconnect])

  return {
    isConnected,
    startConnection,
    disconnect,
    peerConnection: peerConnection.current,
    dataChannel: dataChannel.current,
  }
} 