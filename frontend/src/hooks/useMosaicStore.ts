import {getRobotConfigApi} from "@/client/service/robot.api.ts"
import {useContext} from "react"
import {MosaicContext} from "@/contexts/MosaicContext.ts"
import type {RobotConfig, RobotConnector} from "@/mosaic"
import {RobotInfo} from "@/mosaic/robot-info.ts"

export function useMosaicStore() {
  const context = useContext(MosaicContext)
  if (!context) {
    throw new Error("useMosaicStore must be used within a MosaicProvider")
  }

  const {storeManager, robotInfos, updateRobotInfo} = context

  const getOrCreateStore = async (robotConnector: RobotConnector) => {
    const robotInfo = robotInfos.find(
      (info) => info.id === robotConnector.robotId,
    )
    if (!robotInfo) {
      throw new Error(`Robot not found: ${robotConnector.robotId}`)
    }

    let robotConfig = robotInfo.robotConfigs
    if (!robotConfig) {
      const response = await getRobotConfigApi(robotConnector.robotId)
      const parsedConfig = JSON.parse(response.connectorConfig) as RobotConfig
      robotConfig = parsedConfig

      updateRobotInfo(
        new RobotInfo(
          robotInfo.id,
          robotInfo.name,
          robotInfo.wsConnected,
          robotInfo.status,
          robotConfig,
        ),
      )
    }

    return storeManager.getOrCreateStore(robotConnector, robotConfig)
  }

  const releaseStore = (robotConnector: RobotConnector) => {
    storeManager.releaseStore(robotConnector)
  }

  return {
    getOrCreateStore,
    releaseStore,
  }
}
