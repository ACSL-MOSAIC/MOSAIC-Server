import { getRobotApi } from "@/client/service/robot.api.ts"
import { MosaicContext } from "@/contexts/MosaicContext.ts"
import { useWebSocket } from "@/hooks/useWebSocket.ts"
import type { RobotConfig } from "@/mosaic"
import { ChannelManager } from "@/mosaic/channel/channel-manager.ts"
import { RobotInfo } from "@/mosaic/robot-info.ts"
import { StoreManager } from "@/mosaic/store/store-manager.ts"
import { SignalingServer } from "@/mosaic/webrtc/signaling-server.ts"
import { WebRTCConnectionManager } from "@/mosaic/webrtc/webrtc-connection-manager.ts"
import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"

export function MosaicProvider({ children }: { children: ReactNode }) {
  const { sendWsMessage, onWsMessage } = useWebSocket()

  const [robotInfos, setRobotInfos] = useState<RobotInfo[]>([])
  const robotInfosRef = useRef<RobotInfo[]>([])
  const storeManagerRef = useRef(new StoreManager())
  const channelManagerRef = useRef(new ChannelManager())
  const signalingServerRef = useRef<SignalingServer | null>(null)
  if (signalingServerRef.current === null) {
    signalingServerRef.current = new SignalingServer(sendWsMessage, onWsMessage)
  }
  const webrtcConnectionManagerRef = useRef<WebRTCConnectionManager | null>(
    null,
  )
  if (webrtcConnectionManagerRef.current === null) {
    webrtcConnectionManagerRef.current = new WebRTCConnectionManager(
      signalingServerRef.current,
    )
  }

  useEffect(() => {
    robotInfosRef.current = robotInfos
  }, [robotInfos])

  const updateRobotInfo = useCallback((robotInfo: RobotInfo) => {
    setRobotInfos((prev) => {
      const index = prev.findIndex((r) => r.id === robotInfo.id)
      if (index >= 0) {
        const newList = [...prev]
        newList[index] = robotInfo
        return newList
      }
      return [...prev, robotInfo]
    })
  }, [])

  const subscribeRobots = useCallback(
    async (robotIds: string[]) => {
      console.log("subscribe robots: ", robotIds.join(","))
      const robotInfosPromises = robotIds.map(async (robotId) => {
        const response = await getRobotApi(robotId)
        return new RobotInfo(
          response.id,
          response.name,
          response.status,
          JSON.parse(response.connectorConfig) as RobotConfig,
        )
      })
      const newRobotInfos = await Promise.all(robotInfosPromises)
      setRobotInfos(newRobotInfos)
      sendWsMessage({
        type: "status.subscribe",
        data: { robotIds },
      })
    },
    [sendWsMessage],
  )

  const unsubscribeRobots = useCallback(() => {
    sendWsMessage({
      type: "status.unsubscribe",
      data: {
        robotIds: robotInfosRef.current.map((robotInfo) => robotInfo.id),
      },
    })
  }, [sendWsMessage])

  useEffect(() => {
    const unsubscribe = onWsMessage("status.update", async (data) => {
      const currentRobotInfo = robotInfosRef.current.find(
        (robotInfo) => robotInfo.id === data.robotId,
      )

      if (currentRobotInfo && currentRobotInfo.status !== data.status) {
        updateRobotInfo(
          new RobotInfo(
            currentRobotInfo.id,
            currentRobotInfo.name,
            data.status,
            currentRobotInfo.robotConfigs,
          ),
        )
        return
      }
    })

    return () => {
      unsubscribe()
    }
  }, [onWsMessage, updateRobotInfo])

  const contextValue = useMemo(
    () => ({
      robotInfos,
      storeManager: storeManagerRef.current,
      channelManager: channelManagerRef.current,
      webrtcConnectionManager: webrtcConnectionManagerRef.current!,
      updateRobotInfo,
      subscribeRobots,
      unsubscribeRobots,
    }),
    [robotInfos, updateRobotInfo, subscribeRobots, unsubscribeRobots],
  )

  return (
    <MosaicContext.Provider value={contextValue}>
      {children}
    </MosaicContext.Provider>
  )
}
