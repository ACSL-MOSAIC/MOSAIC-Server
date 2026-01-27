// import React, { useEffect, useRef } from 'react'
// import { useWebRTC } from '../../hooks/useWebRTC'

// interface RobotControlProps {
//   userId: string
//   robotId: string
// }

// export const RobotControl: React.FC<RobotControlProps> = ({ userId, robotId }) => {
//   const videoRef = useRef<HTMLVideoElement>(null)
//   const { isConnected, startConnection, disconnect, peerConnection, dataChannel } = useWebRTC(
//     userId,
//     robotId
//   )

//   useEffect(() => {
//     if (peerConnection) {
//       peerConnection.ontrack = (event) => {
//         if (videoRef.current) {
//           videoRef.current.srcObject = event.streams[0]
//         }
//       }
//     }
//   }, [peerConnection])

//   const handleKeyDown = (event: React.KeyboardEvent) => {
//     if (!isConnected) return

//     let command = ''
//     switch (event.key) {
//       case 'ArrowUp':
//         command = 'forward'
//         break
//       case 'ArrowDown':
//         command = 'backward'
//         break
//       case 'ArrowLeft':
//         command = 'left'
//         break
//       case 'ArrowRight':
//         command = 'right'
//         break
//       case ' ':
//         command = 'stop'
//         break
//       default:
//         return
//     }

//     if (dataChannel?.readyState === 'open') {
//       dataChannel.send(JSON.stringify({ command }))
//     }
//   }

//   return (
//     <div
//       className="flex flex-col items-center gap-4 p-4"
//       tabIndex={0}
//       onKeyDown={handleKeyDown}
//     >
//       <div className="relative w-full max-w-2xl">
//         <video
//           ref={videoRef}
//           autoPlay
//           playsInline
//           className="w-full rounded-lg shadow-lg"
//         />
//         <div className="absolute bottom-4 left-4">
//           <span
//             className={`px-2 py-1 rounded text-sm ${
//               isConnected ? 'bg-green-500' : 'bg-red-500'
//             } text-white`}
//           >
//             {isConnected ? '연결됨' : '연결 끊김'}
//           </span>
//         </div>
//       </div>

//       <div className="flex gap-4">
//         <button
//           onClick={startConnection}
//           disabled={isConnected}
//           className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
//         >
//           연결
//         </button>
//         <button
//           onClick={disconnect}
//           disabled={!isConnected}
//           className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:bg-gray-400"
//         >
//           연결 해제
//         </button>
//       </div>

//       <div className="text-center text-gray-600">
//         <p>방향키를 사용하여 로봇을 제어하세요22222222222222222222222222₩</p>
//         <p>스페이스바를 눌러 정지하세요</p>
//       </div>
//     </div>
//   )
// }
