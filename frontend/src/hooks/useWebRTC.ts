import { useEffect, useRef, useState } from "react"
import { useWebSocket } from "@/contexts/WebSocketContext"
import useCustomToast from "@/hooks/useCustomToast"
import { createControlChannel, sendControlCommand, sendConnectionCheck } from "@/rtc/control"
import { setupPositionChannel } from "@/rtc/position"

interface WebRTCConnection {
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
): WebRTCConnection {
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

    if (dataChannelRef.current?.readyState === 'open') {
      sendConnectionCheck(dataChannelRef.current, userId, robotId)
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

      dataChannelRef.current = createControlChannel(peerConnection)
      dataChannelRef.current.onopen = () => {
        console.log('remote_control_data_channel opened')
        setIsConnected(true)
      }

      dataChannelRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.type === 'connection_check') {
            lastConnectionCheckTime.current = Date.now()
          }
        } catch (error) {
          console.error('Error parsing control data:', error)
        }
      }

      peerConnection.ondatachannel = (event) => {
        const channel = event.channel
        if (channel.label === 'position_data_channel' && canvasRef.current && positionElementRef.current) {
          console.log('Position channel received')
          setupPositionChannel(channel, {
            canvas: canvasRef.current,
            positionElement: positionElementRef.current
          })
        }
      }

      peerConnection.addTransceiver('video', {direction: 'sendrecv'})
      
      console.log("SDP Offer 생성 시작...")
      const offer = await peerConnection.createOffer()
      console.log("SDP Offer 생성 완료:", offer)
      
      console.log("Local Description 설정 시작...")
      await peerConnection.setLocalDescription(offer)
      console.log("Local Description 설정 완료")

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

  const sendControlData = (direction: 'up' | 'down' | 'left' | 'right') => {
    if (!dataChannelRef.current || dataChannelRef.current.readyState !== 'open') {
      console.error('Control channel is not open')
      return
    }
    sendControlCommand(dataChannelRef.current, direction)
  }

  useEffect(() => {
    const unsubscribe = (onMessage("receive_ice_candidate", async (data: any) => {
      if (!peerConnectionRef.current) {
        console.error("PeerConnection이 초기화되지 않았습니다.")
        return
      }

      const candidate = (data as ReceiveIceCandidateMessage).ice_candidate
      console.log("ICE Candidate 수신:", candidate)
      console.log("Remote Description 설정 여부:", isRemoteDescriptionSet.current)
      console.log("현재 PeerConnection 상태:", peerConnectionRef.current.signalingState)

      try {
        if (!isRemoteDescriptionSet.current || peerConnectionRef.current.signalingState === 'closed') {
          console.log("Remote Description이 아직 설정되지 않아 ICE Candidate 임시 저장")
          pendingCandidates.current.push(candidate)
          return
        }

        console.log("Remote Description이 설정되어 있어 ICE Candidate 추가 시도")
        await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate))
        console.log("ICE Candidate 추가 완료")
      } catch (error) {
        console.error("ICE Candidate 처리 실패:", error)
        console.log("ICE Candidate 임시 저장")
        pendingCandidates.current.push(candidate)
      }
    }) as unknown) as () => void

    return () => {
      unsubscribe()
    }
  }, [onMessage])

  useEffect(() => {
    const unsubscribe = (onMessage<ReceiveSdpAnswerMessage>("receive_sdp_answer", async (data) => {
      if (!peerConnectionRef.current) {
        console.error("PeerConnection이 초기화되지 않았습니다.")
        return
      }

      try {
        console.log("SDP Answer 수신:", data)
        const answer = data.sdp_answer
        
        console.log("현재 PeerConnection 상태:", peerConnectionRef.current.signalingState)
        
        if (peerConnectionRef.current.signalingState !== 'have-local-offer') {
          console.error("잘못된 상태에서 Answer를 설정하려고 시도했습니다. 현재 상태:", peerConnectionRef.current.signalingState)
          return
        }

        console.log("Remote Description 설정 시작...")
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription({sdp: answer, type: 'answer'}))
        console.log("Remote Description 설정 완료")
        isRemoteDescriptionSet.current = true

        if (pendingCandidates.current.length > 0) {
          console.log("저장된 ICE candidate 개수:", pendingCandidates.current.length)
          for (const candidate of pendingCandidates.current) {
            try {
              console.log("Pending ICE Candidate 추가 시도:", candidate)
              await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate))
              console.log("Pending ICE Candidate 추가 완료")
            } catch (error) {
              console.error("Pending ICE candidate 추가 실패:", error)
            }
          }
          pendingCandidates.current = []
        }
      } catch (error) {
        console.error("Remote Description 설정 실패:", error)
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
    fps,
    sendControlData
  }
} 