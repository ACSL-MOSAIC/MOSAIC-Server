import { SendIceCandidateMessage, SendSdpOfferMessage, WebSocketContextType } from "@/contexts/WebSocketContext"

export function setupWebSocketHandlers(
  ws: WebSocketContextType,
  robotId: string,
  callbacks: {
    onSdpAnswer: (sdpAnswer: string) => Promise<void>,
    onIceCandidate: (candidate: RTCIceCandidate) => Promise<void>
  }
) {
  const unsubscribeFunctions: (() => void)[] = []

  // SDP Answer 수신 핸들러
  const unsubscribeSdpAnswer = ws.onMessage("receive_sdp_answer", async (data: any) => {
    if (data.robot_id === robotId) {
      try {
        await callbacks.onSdpAnswer(data.sdp_answer)
      } catch (error) {
        console.error('SDP Answer 처리 중 에러:', error)
      }
    }
  })

  // ICE Candidate 수신 핸들러
  const unsubscribeIceCandidate = ws.onMessage("receive_ice_candidate", async (data: any) => {
    if (data.robot_id === robotId) {
      try {
        const candidate = new RTCIceCandidate(data.ice_candidate)
        await callbacks.onIceCandidate(candidate)
      } catch (error) {
        console.error('ICE Candidate 처리 중 에러:', error)
      }
    }
  })

  unsubscribeFunctions.push(unsubscribeSdpAnswer, unsubscribeIceCandidate)

  return {
    unsubscribe: () => {
      unsubscribeFunctions.forEach(unsubscribe => unsubscribe())
    }
  }
}

export function sendWebSocketMessage(
  ws: WebSocketContextType,
  message: SendSdpOfferMessage | SendIceCandidateMessage
) {
  ws.sendMessage(message)
}
