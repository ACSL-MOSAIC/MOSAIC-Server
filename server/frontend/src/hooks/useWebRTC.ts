import { useEffect, useRef, useState } from "react"
import { useWebSocket } from "@/contexts/WebSocketContext"
import useCustomToast from "@/hooks/useCustomToast"

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
  const isRemoteDescriptionSet = useRef(false)
  const pendingCandidates = useRef<any[]>([])
  const { showErrorToast } = useCustomToast()

  useEffect(() => {
    console.log("WebRTC 자동 연결 시도...")
    if (userId && robotId && !isConnected) {
      startConnection()
    }
  }, [userId, robotId])

  const createPeerConnection = () => {
    console.log("PeerConnection 생성 중...")
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

  const sendIceCandidate = (userId: string, robotId: string, candidate: RTCIceCandidate) => {
    try {
      sendMessage({
        type: "send_ice_candidate",
        user_id: userId,
        robot_id: robotId,
        ice_candidate: {
          candidate: candidate.candidate,
          sdpMid: candidate.sdpMid,
          sdpMLineIndex: candidate.sdpMLineIndex
        }
      })
    } catch (e) {
      showErrorToast("ICE candidate 전송 실패: " + (e instanceof Error ? e.message : String(e)))
    }
  }

  const startConnection = async () => {
    try {
      console.log("WebRTC 연결 시작...", { userId, robotId })
      const peerConnection = createPeerConnection()
      peerConnectionRef.current = peerConnection

      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          console.log("ICE Candidate 생성:", event.candidate)
          try {
            sendIceCandidate(userId, robotId, event.candidate)
          } catch (e) {
            console.error("ICE candidate 전송 실패 (WebSocket 연결 상태 확인 필요)", e)
          }
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

      peerConnection.addTransceiver('video', {direction: 'sendrecv'});
      const offer = await peerConnection.createOffer()
        
      console.log("SDP Offer 생성:", offer)
      await peerConnection.setLocalDescription(offer)

      console.log("SDP Offer 전송:", offer)
      sendMessage({
        type: "send_sdp_offer",
        user_id: userId,
        robot_id: robotId,
        sdp_offer: offer.sdp ?? ""
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

  useEffect(() => {
    const unsubscribe = (onMessage<ReceiveSdpAnswerMessage>("receive_sdp_answer", async (data) => {
      if (!peerConnectionRef.current) return

      try {
        console.log("SDP Answer 수신:", data)
        const answer = data.sdp_answer
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription({sdp: answer, type: 'answer'}))
        console.log("Remote Description 설정 완료")
        isRemoteDescriptionSet.current = true
        for (const candidate of pendingCandidates.current) {
          try {
            await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate))
            console.log("Pending ICE Candidate 추가 완료", candidate)
          } catch (error) {
            console.error("Pending ICE candidate 추가 실패", error)
          }
        }
        pendingCandidates.current = []
      } catch (error) {
        console.error("Failed to set remote description:", error)
      }
    }) as unknown) as () => void

    return () => {
      unsubscribe()
    }
  }, [onMessage])

  useEffect(() => {
    const unsubscribe = (onMessage("receive_ice_candidate", async (data: any) => {
      if (!peerConnectionRef.current) return
      try {
        const candidate = (data as ReceiveIceCandidateMessage).ice_candidate
        if (isRemoteDescriptionSet.current) {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate))
          console.log("ICE Candidate 추가 완료")
        } else {
          pendingCandidates.current.push(candidate)
          console.log("ICE Candidate 임시 저장", candidate)
        }
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