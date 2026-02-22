import { MosaicContext } from "@/contexts/MosaicContext.ts"
import type { RobotConnector } from "@/mosaic"
import { useContext } from "react"

export function useMosaicStore() {
  const context = useContext(MosaicContext)
  if (!context) {
    throw new Error("useMosaicStore must be used within a MosaicProvider")
  }

  const { storeManager, channelManager, robotInfos } = context

  const getOrCreateStore = (robotConnector: RobotConnector) => {
    const robotInfo = robotInfos.find(
      (info) => info.id === robotConnector.robotId,
    )
    if (!robotInfo) {
      throw new Error(`Robot not found: ${robotConnector.robotId}`)
    }

    const store = storeManager.getOrCreateStore(
      robotConnector,
      robotInfo.robotConfigs,
    )
    store.getChannelRequirements(robotConnector).forEach((cr) => {
      channelManager.addChannelRequirement(cr)
    })
    return store
  }

  const releaseStore = (robotConnector: RobotConnector) => {
    storeManager.releaseStore(robotConnector)
  }

  return {
    getOrCreateStore,
    releaseStore,
  }
}
