// import React, { useEffect, useState, useCallback } from "react"
// import { useWebSocket } from "@/contexts/WebSocketContext"
// import { WebRTCConnection, WebRTCConnectionConfig } from "@/rtc/WebRTCConnection"
// import useCustomToast from "@/hooks/useCustomToast"

// export interface RobotConnection {
//   robotId: string
//   isConnected: boolean
//   fps: number
//   connection: WebRTCConnection | null
// }

// export interface UseMultiRobotConfig {
//   userId: string
//   videoRefs: { [key: string]: React.RefObject<HTMLVideoElement> }
//   canvasRefs: { [key: string]: React.RefObject<HTMLCanvasElement> }
//   positionElementRefs: { [key: string]: React.RefObject<HTMLElement> }
// }

// export function useMultiRobot(config: UseMultiRobotConfig) {
//   const { sendMessage, onMessage } = useWebSocket()
//   const [connections, setConnections] = useState<{ [key: string]: RobotConnection }>({})
//   const { showErrorToast } = useCustomToast()
//   const connectionRefs = React.useRef<{ [key: string]: WebRTCConnection }>({})

//   const handleConnectionStateChange = (robotId: string, isConnected: boolean) => {
//     setConnections(prev => ({
//       ...prev,
//       [robotId]: {
//         ...prev[robotId],
//         isConnected
//       }
//     }))
//   }

//   const handleFpsChange = (robotId: string, fps: number) => {
//     setConnections(prev => ({
//       ...prev,
//       [robotId]: {
//         ...prev[robotId],
//         fps
//       }
//     }))
//   }

//   const handleError = (robotId: string, error: Error) => {
//     // showErrorToast(`로봇 ${robotId} 연결 오류: ${error.message}`)
//     setConnections(prev => ({
//       ...prev,
//       [robotId]: {
//         robotId,
//         isConnected: false,
//         fps: 0,
//         connection: null
//       }
//     }))
//   }

//   const connectToRobot = useCallback(async (robotId: string) => {
//     console.log(`로봇 ${robotId} 연결 시작`)

//     // 이미 연결된 경우 체크
//     if (connections[robotId]?.isConnected) {
//       console.log('이미 연결된 로봇입니다:', robotId)
//       return
//     }

//     // 기존 연결이 있다면 정리
//     if (connectionRefs.current[robotId]) {
//       console.log('기존 연결 정리:', robotId)
//       connectionRefs.current[robotId].disconnect()
//       delete connectionRefs.current[robotId]
//     }

//     try {
//       // 연결 객체 생성
//       const connection = new WebRTCConnection({
//         userId: config.userId,
//         robotId,
//         videoRef: config.videoRefs[robotId],
//         canvasRef: config.canvasRefs[robotId],
//         positionElementRef: config.positionElementRefs[robotId],
//         onConnectionStateChange: (isConnected) => {
//           console.log(`로봇 ${robotId} 연결 상태 변경:`, isConnected)
//           handleConnectionStateChange(robotId, isConnected)
//           if (isConnected) {
//             sendMessage({
//               type: "connected_robot_rtc",
//               user_id: config.userId,
//               robot_id: robotId
//             })
//           } else {
//             sendMessage({
//               type: "disconnected_robot_rtc",
//               user_id: config.userId,
//               robot_id: robotId
//             })
//           }
//         },
//         onFpsChange: (fps) => {
//           handleFpsChange(robotId, fps)
//         },
//         onError: (error) => {
//           console.error(`로봇 ${robotId} 연결 에러:`, error)
//           handleError(robotId, error)
//         }
//       })

//       // 연결 객체 저장
//       connectionRefs.current[robotId] = connection

//       // 연결 시작
//       console.log(`로봇 ${robotId}의 SDP offer 생성 시작`)
//       const offer = await connection.startConnection()
//       if (!offer.sdp) {
//         throw new Error("SDP offer 생성 실패")
//       }

//       console.log(`로봇 ${robotId}의 SDP offer 생성 완료:`, offer.sdp)

//       // SDP offer를 서버로 전송
//       const message = {
//         type: "send_sdp_offer" as const,
//         user_id: config.userId,
//         robot_id: robotId,
//         sdp_offer: offer.sdp
//       }
//       console.log('WebSocket으로 SDP offer 전송:', message)
//       sendMessage(message)

//       // 연결 상태 업데이트
//       setConnections(prev => ({
//         ...prev,
//         [robotId]: {
//           robotId,
//           isConnected: false,
//           fps: 0,
//           connection
//         }
//       }))
//     } catch (error) {
//       console.error(`로봇 ${robotId} 연결 실패:`, error)
//       showErrorToast(`로봇 ${robotId} 연결 실패: ${error instanceof Error ? error.message : String(error)}`)
//       handleError(robotId, error instanceof Error ? error : new Error(String(error)))
//     }
//   }, [config.userId, config.videoRefs, config.canvasRefs, config.positionElementRefs, connections, sendMessage])

//   const disconnectFromRobot = useCallback((robotId: string) => {
//     const connection = connectionRefs.current[robotId]
//     if (connection) {
//       console.log(`로봇 ${robotId} 연결 해제`)
//       connection.disconnect()
//       delete connectionRefs.current[robotId]
//       setConnections(prev => {
//         const newConnections = { ...prev }
//         delete newConnections[robotId]
//         return newConnections
//       })
//     }
//   }, [])

//   const sendControlData = (robotId: string, direction: 'up' | 'down' | 'left' | 'right') => {
//     const connection = connections[robotId]?.connection
//     if (connection && connections[robotId]?.isConnected) {
//       connection.sendControlData(direction)
//     } else {
//       console.warn(`로봇 ${robotId}가 연결되어 있지 않습니다.`)
//     }
//   }

//   const handleWebSocketMessage = useCallback(async (message: any) => {
//     try {
//       if (message.type === "receive_sdp_answer") {
//         const { robot_id, sdp_answer } = message
//         console.log(`로봇 ${robot_id}의 SDP answer 수신:`, sdp_answer)

//         const connection = connectionRefs.current[robot_id]
//         if (!connection) {
//           console.error(`로봇 ${robot_id}의 연결 객체를 찾을 수 없습니다.`)
//           return
//         }

//         await connection.setRemoteDescription(new RTCSessionDescription({
//           type: 'answer',
//           sdp: sdp_answer
//         }))
//         console.log(`로봇 ${robot_id}의 Remote description 설정 완료`)
//       } else if (message.type === "receive_ice_candidate") {
//         const { robot_id, ice_candidate } = message
//         console.log(`로봇 ${robot_id}의 ICE candidate 수신:`, ice_candidate)

//         const connection = connectionRefs.current[robot_id]
//         if (!connection) {
//           console.error(`로봇 ${robot_id}의 연결 객체를 찾을 수 없습니다.`)
//           return
//         }

//         await connection.addIceCandidate(new RTCIceCandidate(ice_candidate))
//         console.log(`로봇 ${robot_id}의 ICE candidate 적용 완료`)
//       }
//     } catch (error) {
//       console.error(`로봇 ${message.robot_id} 메시지 처리 중 에러:`, error)
//     }
//   }, [])

//   useEffect(() => {
//     onMessage("receive_sdp_answer", handleWebSocketMessage)
//     onMessage("receive_ice_candidate", handleWebSocketMessage)

//     return () => {
//       // 연결 정리
//       Object.keys(connectionRefs.current).forEach(robotId => {
//         const connection = connectionRefs.current[robotId]
//         if (connection) {
//           connection.disconnect()
//           delete connectionRefs.current[robotId]
//         }
//       })
//     }
//   }, [config.userId, connectToRobot, onMessage])

//   return {
//     connections,
//     connectToRobot,
//     disconnectFromRobot,
//     sendControlData,
//     connectionRefs: connectionRefs.current
//   }
// }
