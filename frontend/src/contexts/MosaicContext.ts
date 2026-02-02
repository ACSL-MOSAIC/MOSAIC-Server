import {createContext} from "react"
import type {StoreManager} from "@/mosaic/store/store-manager.ts"
import type {ChannelManager} from "@/mosaic/channel/channel-manager.ts"
import type {WebRTCConnectionManager} from "@/mosaic/webrtc/webrtc-connection-manager.ts"
import type {RobotInfo} from "@/mosaic/robot-info.ts"

export interface MosaicContextType {
  storeManager: StoreManager
  channelManager: ChannelManager
  webrtcConnectionManager: WebRTCConnectionManager
  robotInfos: RobotInfo[]
  updateRobotInfo: (robotInfo: RobotInfo) => void
}

export const MosaicContext = createContext<MosaicContextType | null>(null)
