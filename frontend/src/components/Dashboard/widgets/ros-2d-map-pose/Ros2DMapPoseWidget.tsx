import {useCallback, useEffect, useRef, useState} from "react"
import {WidgetFrame} from "../WidgetFrame"
import {ReadOnlyStoreManager} from "@/dashboard/store/data-channel-store/readonly/read-only-store-manager.ts"
import {useRobotMapping} from "@/hooks/useRobotMapping.ts"
import {Ros2DMapPoseSetting} from "./Ros2DMapPoseSetting"
import {Ros2DPoseStore} from "@/dashboard/store/data-channel-store/readonly/ros-2d-pose.store"
import {
  type ParsedRos2DPose,
  ROS_2D_POSE_TYPE,
} from "@/dashboard/parser/ros2-d-pose-with-covariance.ts"

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
  pose: ParsedRos2DPose
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
  const canvasRef = useRef<HTMLCanvasElement>(null)
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

  const onPoseUpdate = (robotId: string, pose: ParsedRos2DPose) => {
    // 내부 state 에 좌표 저장
    setRobotRos2DPoses((prev) => {
      const existingIndex = prev.findIndex((item) => item.robotId === robotId)
      if (existingIndex !== -1) {
        // 기존에 있는 로봇의 좌표 업데이트
        const updated = [...prev]
        updated[existingIndex].pose = pose
        return updated
      }
      // 새로운 로봇의 좌표 추가
      return [...prev, {robotId, pose: pose}]
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

  // 캔버스 크기 설정 함수
  const setCanvasSize = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1

    // 실제 캔버스 크기 (픽셀)
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr

    // 컨텍스트 스케일 조정
    ctx.scale(dpr, dpr)

    return {
      canvas,
      ctx,
      canvasWidth: canvas.width,
      canvasHeight: canvas.height,
    }
  }

  const drawMap = () => {
    const canvasInfo = setCanvasSize()
    if (!canvasInfo) return
    const {canvas, ctx, canvasWidth, canvasHeight} = canvasInfo

    // Clear canvas
    ctx.clearRect(0, 0, canvasWidth, canvasHeight)
    ctx.fillStyle = "white"
    ctx.fillRect(0, 0, canvasWidth, canvasHeight)

    return {
      canvas,
      ctx,
      canvasWidth,
      canvasHeight,
    }
  }

  const drawSingleRobotMarker = (
    ctx: CanvasRenderingContext2D,
    robotId: string,
    pose: ParsedRos2DPose,
  ) => {
    ctx.fillStyle = "red"
    ctx.fillRect(150, 150, 10, 10)
  }

  // 모든 로봇의 마커를 재렌더링
  const drawRobotMarkers = () => {
    const canvasInfo = drawMap()
    if (!canvasInfo) return

    const {canvas, ctx, canvasWidth, canvasHeight} = canvasInfo

    const activeRobotRos2DPoses = robotRos2DPoses.filter(({robotId}) => {
      return connections ? connections[robotId] : false
    })

    for (const {robotId, pose} of activeRobotRos2DPoses) {
      drawSingleRobotMarker(ctx, robotId, pose)
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resizeObserver = new ResizeObserver(() => {
      // robot marker 그릴 시 캔버스 크기도 재설정
      drawRobotMarkers()
    })

    resizeObserver.observe(canvas)

    return () => resizeObserver.disconnect()
  }, [canvasRef.current])

  useEffect(() => {
    drawRobotMarkers()
  }, [robotRos2DPoses])

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
          <canvas
            ref={canvasRef}
            style={{
              width: "100%",
              height: "100%",
              borderRadius: "8px",
              cursor: "crosshair",
            }}
          />
          {canvasRef.current?.width} x {canvasRef.current?.height}
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
