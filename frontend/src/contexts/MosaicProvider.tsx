import {MosaicContext} from "@/contexts/MosaicContext.ts"
import {useWebSocket} from "@/hooks/useWebSocket.ts"
import {ChannelManager} from "@/mosaic/channel/channel-manager.ts"
import type {RobotInfo} from "@/mosaic/robot-info.ts"
import {StoreManager} from "@/mosaic/store/store-manager.ts"
import {SignalingServer} from "@/mosaic/webrtc/signaling-server.ts"
import {WebRTCConnectionManager} from "@/mosaic/webrtc/webrtc-connection-manager.ts"
import {type ReactNode, useCallback, useMemo, useRef, useState} from "react"

export function MosaicProvider({children}: { children: ReactNode }) {
  const {sendWsMessage, onWsMessage} = useWebSocket()

  const [robotInfos, setRobotInfos] = useState<RobotInfo[]>([])
  const storeManagerRef = useRef(new StoreManager())
  const channelManagerRef = useRef(new ChannelManager())
  const signalingServerRef = useRef(new SignalingServer(sendWsMessage, onWsMessage))
  const webrtcConnectionManagerRef = useRef(
    new WebRTCConnectionManager(signalingServerRef.current),
  )

  onWsMessage("get_robot_list", (_data) => {
    // TODO
    setRobotInfos([])
  })

  const updateRobotInfo = useCallback((robotInfo: RobotInfo) => {
    setRobotInfos((prev) => {
      const index = prev.findIndex((r) => r.id === robotInfo.id)
      if (index >= 0) {
        // 기존 로봇 정보 업데이트
        const newList = [...prev]
        newList[index] = robotInfo
        return newList
      }
      // 새 로봇 추가
      return [...prev, robotInfo]
    })
  }, [])

  const contextValue = useMemo(
    () => ({
      robotInfos,
      storeManager: storeManagerRef.current,
      channelManager: channelManagerRef.current,
      webrtcConnectionManager: webrtcConnectionManagerRef.current,
      updateRobotInfo,
    }),
    [robotInfos, updateRobotInfo],
  )

  return (
    <MosaicContext.Provider value={contextValue}>
      {children}
    </MosaicContext.Provider>
  )
}
