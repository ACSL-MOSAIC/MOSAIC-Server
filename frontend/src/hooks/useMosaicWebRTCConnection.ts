import {MosaicContext} from "@/contexts/MosaicContext.ts"
import {useContext} from "react"

export function useMosaicWebRTCConnection() {
  const context = useContext(MosaicContext)
  if (!context) {
    throw new Error(
      "useMosaicWebRTCConnection must be used within a MosaicProvider",
    )
  }

  const {webrtcConnectionManager, channelManager} = context
  const createConnection = async (robotId: string) => {
    const channelRequirements = channelManager.getChannelRequirements(robotId)
    if (channelRequirements.length === 0) {
      console.warn(
        `[${robotId}] Skip WebRTC connection: no channel requirements`,
      )
      return
    }

    await webrtcConnectionManager.prepareRtcConnection([robotId])
    await webrtcConnectionManager.createConnection(robotId, channelRequirements)
  }

  const disconnectConnection = (robotId: string) => {
    webrtcConnectionManager.disconnectConnection(robotId)
  }
  return {
    createConnection,
    disconnectConnection,
  }
}
