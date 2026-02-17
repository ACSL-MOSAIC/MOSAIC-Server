import {MosaicContext} from "@/contexts/MosaicContext.ts"
import {useContext} from "react"

export function useMosaicWebRTCConnection() {
  const context = useContext(MosaicContext)
  if (!context) {
    throw new Error(
      "useMosaicWebRTCConnection must be used within a MosaicProvider",
    )
  }

  const {webrtcConnectionManager} = context
  const createConnection = async (robotId: string) => {
    // TODO: channelManager에서 channelRequirements 받아와야함
    await webrtcConnectionManager.prepareRtcConnection([robotId])
    await webrtcConnectionManager.createConnection(robotId, [])
  }

  const disconnectConnection = (robotId: string) => {
    webrtcConnectionManager.disconnectConnection(robotId)
  }
  return {
    createConnection,
    disconnectConnection,
  }
}
