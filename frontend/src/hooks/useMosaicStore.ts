import {useContext} from "react"
import {MosaicContext} from "@/contexts/MosaicContext.ts"
import type {RobotConnector} from "@/mosaic"

export function useMosaicStore() {
  const context = useContext(MosaicContext)
  if (!context) {
    throw new Error("useMosaicStore must be used within a MosaicProvider")
  }

  const {storeManager} = context
  const getOrCreateStore = (robotConnector: RobotConnector) => {
    // TODO
    return storeManager.getOrCreateStore(robotConnector, null)
  }

  const releaseStore = (robotConnector: RobotConnector) => {
    // TODO
  }

  return {
    getOrCreateStore,
    releaseStore,
  }
}
