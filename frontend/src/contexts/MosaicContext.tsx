import {createContext, type ReactNode, useRef, useState, useMemo, useCallback} from "react"
import {StoreManager} from "@/mosaic/store/store-manager.ts"
import {ChannelManager} from "@/mosaic/channel/channel-manager.ts"
import {WebRTCConnectionManager} from "@/mosaic/webrtc/webrtc-connection-manager.ts"
import type {RobotInfo} from "@/mosaic/robot-info.ts"
import {useWebSocket} from "@/hooks/useWebSocket.ts"

export interface MosaicContextType {
  storeManager: StoreManager
  channelManager: ChannelManager
  webrtcConnectionManager: WebRTCConnectionManager
  robotInfos: RobotInfo[]
  updateRobotInfo: (robotInfo: RobotInfo) => void
}

export const MosaicContext = createContext<MosaicContextType | null>(null)

export function MosaicProvider({children}: { children: ReactNode }) {
  const [robotInfos, setRobotInfos] = useState<RobotInfo[]>([])
  const storeManagerRef = useRef(new StoreManager())
  const channelManagerRef = useRef(new ChannelManager())
  const webrtcConnectionManagerRef = useRef(new WebRTCConnectionManager())

  const {onMessage} = useWebSocket()

  onMessage("get_robot_list", (_data) => {
    // TODO
    setRobotInfos([])
  })

  const updateRobotInfo = useCallback((robotInfo: RobotInfo) => {
    setRobotInfos(prev => {
      const index = prev.findIndex(r => r.id === robotInfo.id)
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

  const contextValue = useMemo(() => ({
    robotInfos,
    storeManager: storeManagerRef.current,
    channelManager: channelManagerRef.current,
    webrtcConnectionManager: webrtcConnectionManagerRef.current,
    updateRobotInfo,
  }), [robotInfos, updateRobotInfo])

  return (
    <MosaicContext.Provider value={contextValue}>
      {children}
    </MosaicContext.Provider>
  )
}
