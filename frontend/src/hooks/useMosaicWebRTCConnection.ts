import { MosaicContext } from "@/contexts/MosaicContext.ts"
import { useContext } from "react"

export function useMosaicWebRTCConnection() {
  const context = useContext(MosaicContext)
  if (!context) {
    throw new Error(
      "useMosaicWebRTCConnection must be used within a MosaicProvider",
    )
  }

  const { webrtcConnectionManager, channelManager, robotInfos } = context
  const createConnection = async (robotIdList: string[]) => {
    await webrtcConnectionManager.prepareRtcConnection(robotIdList)

    for (const robotId of robotIdList) {
      const robotInfo = robotInfos.find((info) => info.id === robotId)
      if (!robotInfo) continue
      const channelRequirements = channelManager.getChannelRequirements(robotId)
      if (channelRequirements.length === 0) {
        console.warn(
          `[${robotId}] Skip WebRTC connection: no channel requirements`,
        )
        return
      }

      // TODO: 하나 죽더라도 계속 해야함, Promise.allSettled() 조사 필요
      await webrtcConnectionManager.createConnection(
        robotInfo,
        channelRequirements,
      )
    }
  }

  const disconnectConnection = (robotId: string) => {
    webrtcConnectionManager.disconnectConnection(robotId)
  }
  return {
    createConnection,
    disconnectConnection,
  }
}
