import { MosaicContext } from "@/contexts/MosaicContext.ts"
import { useContext } from "react"

export function useRobotInfo() {
  const context = useContext(MosaicContext)
  if (!context) {
    throw new Error("useRobotInfo must be used within a MosaicProvider")
  }

  const { robotInfos, updateRobotInfo, subscribeRobots, unsubscribeRobots } =
    context

  return {
    robotInfos,
    updateRobotInfo,
    subscribeRobots,
    unsubscribeRobots,
  }
}
