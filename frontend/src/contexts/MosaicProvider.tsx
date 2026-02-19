import {getRobotApi, getRobotListApi} from "@/client/service/robot.api.ts"
import {MosaicContext} from "@/contexts/MosaicContext.ts"
import {useWebSocket} from "@/hooks/useWebSocket.ts"
import {ChannelManager} from "@/mosaic/channel/channel-manager.ts"
import {RobotInfo} from "@/mosaic/robot-info.ts"
import {StoreManager} from "@/mosaic/store/store-manager.ts"
import {SignalingServer} from "@/mosaic/webrtc/signaling-server.ts"
import {WebRTCConnectionManager} from "@/mosaic/webrtc/webrtc-connection-manager.ts"
import {type ReactNode, useCallback, useEffect, useMemo, useRef, useState} from "react"

export function MosaicProvider({children}: { children: ReactNode }) {
  const {sendWsMessage, onWsMessage} = useWebSocket()

  const [robotInfos, setRobotInfos] = useState<RobotInfo[]>([])
  const robotInfosRef = useRef<RobotInfo[]>([])
  const storeManagerRef = useRef(new StoreManager())
  const channelManagerRef = useRef(new ChannelManager())
  const signalingServerRef = useRef(new SignalingServer(sendWsMessage, onWsMessage))
  const webrtcConnectionManagerRef = useRef(
    new WebRTCConnectionManager(signalingServerRef.current),
  )

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

  //초기 robot list 조회
  useEffect(() => {
    let isMounted = true
    const fetchRobotList = async () => {
      try {
        const response = await getRobotListApi()
        if (!isMounted) {
          return
        }

        const loadedRobotInfos = response.data.map(
          (robot) => new RobotInfo(robot.id, robot.name, robot.status, null),
        )
        setRobotInfos(loadedRobotInfos)
      } catch (error) {
        console.error("Failed to load robot list", error)
      }
    }

    fetchRobotList()

    return () => {
      isMounted = false
    }
  }, [])

  //robot status 업데이트 이벤트 처리
  useEffect(() => {
    let isMounted = true

    const unsubscribe = onWsMessage("status.update", async (data) => {
      const currentRobotInfo = robotInfosRef.current.find(
        (robotInfo) => robotInfo.id === data.robotId,
      )

      if (currentRobotInfo) {
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

      try {
        const robot = await getRobotApi(data.robotId)
        if (!isMounted) {
          return
        }

        updateRobotInfo(
          new RobotInfo(
            robot.id,
            robot.name,
            data.status,
            null,
          ),
        )
      } catch (error) {
        console.error("Failed to load robot by status.update", error)
      }
    })

    return () => {
      isMounted = false
      unsubscribe()
    }
  }, [onWsMessage, updateRobotInfo])

  const contextValue = useMemo(
    () => ({
      robotInfos,
      storeManager: storeManagerRef.current,
      channelManager: channelManagerRef.current,
      webrtcConnectionManager: webrtcConnectionManagerRef.current,
      updateRobotInfo,
    }),
    [robotInfos, updateRobotInfo],
  )

  return (
    <MosaicContext.Provider value={contextValue}>
      {children}
    </MosaicContext.Provider>
  )
}
