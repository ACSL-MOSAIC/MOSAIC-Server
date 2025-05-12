import { useEffect, useRef, useState } from "react"
import { useWebSocket } from "@/contexts/WebSocketContext"

interface WebRTCConnection {
  isConnected: boolean
  startConnection: () => Promise<void>
  disconnect: () => void
  peerConnection: RTCPeerConnection | null
  dataChannel: RTCDataChannel | null
  fps: number
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
  ice_candidate: string
}

interface ReceiveIceCandidateMessage extends WebSocketMessage {
  type: "receive_ice_candidate"
  user_id: string
  robot_id: string
  ice_candidate: string
}

export function useWebRTC(userId: string, robotId: string, videoRef: React.RefObject<HTMLVideoElement>): WebRTCConnection {
  const { sendMessage, onMessage } = useWebSocket()
  const [isConnected, setIsConnected] = useState(false)
  const [fps, setFps] = useState(0)
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const dataChannelRef = useRef<RTCDataChannel | null>(null)
  const fpsInterval = useRef<NodeJS.Timeout | null>(null)
  const frameCount = useRef(0)
  const lastConnectionCheckTime = useRef<number | null>(null)
  const connectionCheckInterval = useRef<NodeJS.Timeout | null>(null)

  const createPeerConnection = () => {
    const configuration = {
      iceServers: [
        {
          urls: "turn:turn.acslgcs.com:3478",
          username: "gistacsl",
          credential: "qwqw!12321"
        }
      ]
    }
    return new RTCPeerConnection(configuration)
  }

  const updateFPS = () => {
    const currentFPS = frameCount.current
    setFps(currentFPS)
    frameCount.current = 0
  }

  const handleTrack = (event: RTCTrackEvent) => {
    if (!videoRef.current) return

    videoRef.current.srcObject = event.streams[0]

    videoRef.current.onloadedmetadata = () => {
      frameCount.current = 0

      if ('requestVideoFrameCallback' in HTMLVideoElement.prototype) {
        const countFrames = () => {
          frameCount.current++
          videoRef.current?.requestVideoFrameCallback(countFrames)
        }
        if (videoRef.current) {
          videoRef.current.requestVideoFrameCallback(countFrames)
        }
      } else {
        if (videoRef.current) {
          videoRef.current.addEventListener('timeupdate', () => {
            frameCount.current++
          })
        }
      }

      fpsInterval.current = setInterval(updateFPS, 1000)
    }

    videoRef.current.onended = () => {
      if (fpsInterval.current) {
        clearInterval(fpsInterval.current)
        fpsInterval.current = null
      }
    }
  }

  const connectionCheck = () => {
    const currentTime = Date.now()
    if (lastConnectionCheckTime.current && (currentTime - lastConnectionCheckTime.current) < 10000) {
      setIsConnected(true)
    }

    const connectionCheckData = {
      type: 'connection_check',
      user_id: userId,
      robot_id: robotId,
    }

    if (dataChannelRef.current?.readyState === 'open') {
      dataChannelRef.current.send(JSON.stringify(connectionCheckData))
    }
  }

  const startConnection = async () => {
    try {
      const peerConnection = createPeerConnection()
      peerConnectionRef.current = peerConnection

      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          sendMessage({
            type: "send_ice_candidate",
            user_id: userId,
            robot_id: robotId,
            ice_candidate: JSON.stringify(event.candidate)
          })
        }
      }

      peerConnection.ontrack = handleTrack

      const dataChannel = peerConnection.createDataChannel('remote_control')
      dataChannelRef.current = dataChannel

      dataChannel.onopen = () => {
        console.log('remote_control_data_channel opened')
        setIsConnected(true)
      }

      dataChannel.onmessage = (event) => {
        const data = JSON.parse(event.data)
        if (data.type === 'connection_check') {
          lastConnectionCheckTime.current = Date.now()
        }
      }

      const offer = await peerConnection.createOffer()
      await peerConnection.setLocalDescription(offer)

      sendMessage({
        type: "send_sdp_offer",
        user_id: userId,
        robot_id: robotId,
        sdp_offer: JSON.stringify(offer)
      })

      connectionCheckInterval.current = setInterval(connectionCheck, 5000)
    } catch (error) {
      console.error("Failed to start WebRTC connection:", error)
      throw error
    }
  }

  const disconnect = () => {
    if (connectionCheckInterval.current) {
      clearInterval(connectionCheckInterval.current)
      connectionCheckInterval.current = null
    }
    if (fpsInterval.current) {
      clearInterval(fpsInterval.current)
      fpsInterval.current = null
    }
    if (dataChannelRef.current) {
      dataChannelRef.current.close()
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close()
    }
    setIsConnected(false)
    lastConnectionCheckTime.current = null
  }

  // SDP Answer 수신 처리
  useEffect(() => {
    const unsubscribe = (onMessage<ReceiveSdpAnswerMessage>("receive_sdp_answer", async (data) => {
      if (!peerConnectionRef.current) return

      try {
        const answer = JSON.parse(data.sdp_answer)
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer))
      } catch (error) {
        console.error("Failed to set remote description:", error)
      }
    }) as unknown) as () => void

    return () => {
      unsubscribe()
    }
  }, [onMessage])

  // ICE Candidate 수신 처리
  useEffect(() => {
    const unsubscribe = (onMessage<ReceiveIceCandidateMessage>("receive_ice_candidate", async (data) => {
      if (!peerConnectionRef.current) return

      try {
        const candidate = JSON.parse(data.ice_candidate)
        await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate))
      } catch (error) {
        console.error("Failed to add ICE candidate:", error)
      }
    }) as unknown) as () => void

    return () => {
      unsubscribe()
    }
  }, [onMessage])

  return {
    isConnected,
    startConnection,
    disconnect,
    peerConnection: peerConnectionRef.current,
    dataChannel: dataChannelRef.current,
    fps
  }
} 