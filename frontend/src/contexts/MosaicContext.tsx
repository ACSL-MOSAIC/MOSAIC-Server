import {createContext, type ReactNode, useState} from "react"
import {StoreManager} from "@/mosaic/store/store-manager.ts"
import {ChannelManager} from "@/mosaic/channel/channel-manager.ts"
import {WebRTCConnectionManager} from "@/mosaic/webrtc/webrtc-connection-manager.ts"
import {useWebSocket} from "@/contexts/WebSocketContext.tsx"
import type {RobotInfo} from "@/mosaic/robot-info.ts"

export interface MosaicContextType {
  storeManager: StoreManager
  channelManager: ChannelManager
  webrtcConnectionManager: WebRTCConnectionManager
  robotInfos: RobotInfo[]
  updateRobotInfo: (robotInfo: RobotInfo) => void
}

export const MosaicContext = createContext<MosaicContextType | null>(null)

export function MosaicProvider({children}: { children: ReactNode }) {
  // TODO
  const [robotInfos, setRobotInfos] = useState<RobotInfo[]>([])
  const storeManager = new StoreManager()
  const channelManager = new ChannelManager()
  const webrtcConnectionManager = new WebRTCConnectionManager()

  const {onMessage} = useWebSocket()

  onMessage("get_robot_list", (data) => {
    // TODO
    setRobotInfos([])
  })

  const updateRobotInfo = (robotInfo: RobotInfo) => {
    // TODO
  }

  return (
    <MosaicContext.Provider
      value={{
        robotInfos,
        storeManager,
        channelManager,
        webrtcConnectionManager,
        updateRobotInfo,
      }}
    >
      {children}
    </MosaicContext.Provider>
  )
}
