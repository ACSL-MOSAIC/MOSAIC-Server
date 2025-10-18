import {useEffect, useRef, useState} from "react"
import {WidgetFrame} from "../WidgetFrame"
import {ReadOnlyStoreManager} from "@/dashboard/store/data-channel-store/readonly/read-only-store-manager.ts"
import {useRobotMapping} from "@/hooks/useRobotMapping.ts"
import {Ros2DMapPoseSetting} from "./Ros2DMapPoseSetting"
import {Ros2DPoseStore} from "@/dashboard/store/data-channel-store/readonly/ros-2d-pose.store"
import {
  type ParsedRos2DPose,
  ROS_2D_POSE_TYPE,
} from "@/dashboard/parser/ros-2d-pose"

interface Ros2DMapPoseWidgetProps {
  config: Ros2DMapPoseWidgetConfig
  onUpdateConfig?: (newConfig: Ros2DMapPoseWidgetConfig) => void
  setOpenSetting?: (openSetting: boolean) => void
  onRemove?: () => void
  connections?: { [key: string]: boolean }
}

export interface Ros2DMapPoseWidgetConfig {
  robotIdList: string[]
}

interface RobotRos2DPose {
  robotId: string
  coordinate: ParsedRos2DPose
}

export function Ros2DMapPoseWidget({
                                     config,
                                     onUpdateConfig,
                                     onRemove,
                                     connections,
                                   }: Ros2DMapPoseWidgetProps) {
  const readOnlyStoreManager = ReadOnlyStoreManager.getInstance()
  const {getRobotName} = useRobotMapping()

  // TODO: canvas 로 변경 필요
  // PGM 뷰어 컴포넌트 사용 고려
  const mapRef = useRef<any>(null)
  const [isReady, setIsReady] = useState(false)
  const [openSetting, setOpenSetting] = useState(false)
  const [storeList] = useState<Ros2DPoseStore[]>([])
  const [robotRos2DPoses, setRobotRos2DPoses] = useState<RobotRos2DPose[]>([])

  config.robotIdList.forEach((robotId) => {
    const ros2DPoseStore = readOnlyStoreManager.createStoreIfNotExists(
      robotId,
      ROS_2D_POSE_TYPE,
      (robotId) => new Ros2DPoseStore(robotId),
    )
    storeList.push(ros2DPoseStore as Ros2DPoseStore)
  })

  const activeRobotRos2DPoses = robotRos2DPoses.filter(({robotId}) => {
    return connections ? connections[robotId] : false
  })

  const onPoseUpdate = (robotId: string, coord: ParsedGPSCoordinate) => {
    // 내부 state 에 좌표 저장
    setRobotRos2DPoses((prev) => {
      const existingIndex = prev.findIndex((item) => item.robotId === robotId)
      if (existingIndex !== -1) {
        // 기존에 있는 로봇의 좌표 업데이트
        const updated = [...prev]
        updated[existingIndex].coordinate = coord
        return updated
      }
      // 새로운 로봇의 좌표 추가
      return [...prev, {robotId, coordinate: coord}]
    })
  }

  useEffect(() => {
    const unsubscribeList: (() => void)[] = []
    storeList.forEach((store) => {
      const unsubscribe = store.subscribe((coord) => {
        onPoseUpdate(store.robotId, coord)
      })
      unsubscribeList.push(unsubscribe)
    })
    return () => {
      unsubscribeList.forEach((unsubscribe) => unsubscribe())
    }
  }, [storeList])

  // 모든 로봇의 마커를 재렌더링
  const drawRobotMarker = () => {
    if (!mapRef.current) return
    const map = mapRef.current

    // Clear existing markers
    map.eachLayer((layer) => {
      if ((layer as any)._icon) {
        map.removeLayer(layer)
      }
    })

    // Draw markers for each robot
    activeRobotRos2DPoses.forEach(({robotId, coordinate}) => {
      if (coordinate.latitude && coordinate.longitude) {
        const name = getRobotName(robotId)
        console.log("Draw marker for robot:", name, coordinate)
        const marker = L.marker([coordinate.latitude, coordinate.longitude], {
          title: name,
        })

        marker.addTo(map).bindTooltip(name)
      }
    })
  }

  const flyToRobot = (robotId: string) => {
    if (!mapRef.current) return
    const map = mapRef.current

    const robot = activeRobotRos2DPoses.find((r) => r.robotId === robotId)
    if (robot?.coordinate.latitude && robot?.coordinate.longitude) {
      map.flyTo([robot.coordinate.latitude, robot.coordinate.longitude], 15)
    }
  }

  useEffect(() => {
    if (isReady) {
      drawRobotMarker()
    }
  }, [isReady, robotRos2DPoses])

  const center = {
    lat: 36.17,
    lng: 127.0,
  }

  setInterval(() => {
    if (mapRef.current) {
      mapRef.current.invalidateSize(true)
    }
  }, 200)

  return (
    <>
      <WidgetFrame
        title="Ros 2D Map Pose Widget"
        isConnected={true}
        padding="4"
        onSettingClick={() => {
          setOpenSetting?.(true)
        }}
        onRemove={onRemove}
      >
        <div style={{position: "relative", height: "100%", width: "100%"}}>
          {/* Robot List */}
          <div
            style={{
              position: "absolute",
              top: "10px",
              right: "10px",
              backgroundColor: "white",
              border: "1px solid #ccc",
              borderRadius: "4px",
              padding: "8px",
              maxHeight: "200px",
              overflowY: "auto",
              minWidth: "200px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              zIndex: 1000,
            }}
          >
            <div
              style={{
                fontWeight: "bold",
                marginTop: "4px",
                fontSize: "12px",
              }}
            >
              Robots
            </div>
            {activeRobotRos2DPoses.length === 0 ? (
              <div style={{fontSize: "11px", color: "#666"}}>No robots</div>
            ) : (
              activeRobotRos2DPoses.map(({robotId, coordinate}) => (
                // biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
                <div
                  key={robotId}
                  onClick={() => flyToRobot(robotId)}
                  style={{
                    cursor: "pointer",
                    padding: "2px 4px",
                    fontSize: "11px",
                    borderRadius: "2px",
                    marginBottom: "2px",
                    backgroundColor: "#f5f5f5",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#e0e0e0"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#f5f5f5"
                  }}
                >
                  {getRobotName(robotId)} ({coordinate.latitude?.toFixed(4)},{" "}
                  {coordinate.longitude?.toFixed(4)})
                </div>
              ))
            )}
          </div>
        </div>
      </WidgetFrame>
      {openSetting && (
        <Ros2DMapPoseSetting
          isOpen={openSetting}
          config={config}
          onUpdateConfig={onUpdateConfig}
          onClose={() => {
            setOpenSetting?.(false)
          }}
        />
      )}
    </>
  )
}
