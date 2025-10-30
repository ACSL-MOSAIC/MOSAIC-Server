import {
  getOccupancyMapPgmApi,
  getOccupancyMapYamlApi,
  readOccupancyMapApi,
} from "@/client/service/occupancy-map.api.ts"
import {
  type PgmMapData,
  loadPgmMap,
} from "@/components/Dashboard/widgets/ros-2d-map-pose/load-pgm-map.ts"
import {
  type YamlMapData,
  loadYamlMap,
} from "@/components/Dashboard/widgets/ros-2d-map-pose/load-yaml-map.ts"
import {
  type ParsedRos2DPose,
  ROS_2D_POSE_TYPE,
} from "@/dashboard/parser/ros2-d-pose-with-covariance.ts"
import {ReadOnlyStoreManager} from "@/dashboard/store/data-channel-store/readonly/read-only-store-manager.ts"
import {Ros2DPoseStore} from "@/dashboard/store/data-channel-store/readonly/ros-2d-pose.store"
import {useRobotMapping} from "@/hooks/useRobotMapping.ts"
import {Box, Text} from "@chakra-ui/react"
import {useCallback, useEffect, useRef, useState} from "react"
import {WidgetFrame} from "../WidgetFrame"
import {Ros2DMapPoseSetting} from "./Ros2DMapPoseSetting"

interface Ros2DMapPoseWidgetProps {
  config: Ros2DMapPoseWidgetConfig
  onUpdateConfig?: (newConfig: Ros2DMapPoseWidgetConfig) => void
  setOpenSetting?: (openSetting: boolean) => void
  onRemove?: () => void
  connections?: { [key: string]: boolean }
}

export interface Ros2DMapPoseWidgetConfig {
  robotIdList: string[]
  occupancyMapId?: string
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

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [openSetting, setOpenSetting] = useState(false)
  const [storeList, setStoreList] = useState<Ros2DPoseStore[]>([])
  const [robotRos2DPoses, setRobotRos2DPoses] = useState<RobotRos2DPose[]>([])
  const [pgmMapData, setPgmMapData] = useState<PgmMapData | null>(null)
  const [yamlMapData, setYamlMapData] = useState<YamlMapData | null>(null)
  const [occupancyMapName, setOccupancyMapName] = useState<string>("")

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    setStoreList([])
    config.robotIdList.forEach((robotId) => {
      const ros2DPoseStore = readOnlyStoreManager.createStoreIfNotExists(
        robotId,
        ROS_2D_POSE_TYPE,
        (robotId) => new Ros2DPoseStore(robotId),
      )
      storeList.push(ros2DPoseStore as Ros2DPoseStore)
    })

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
  }, [config.robotIdList])

  const loadOccupancyMapFromApi = useCallback(
    async (occupancyMapId: string) => {
      try {
        const [pgmBlob, yamlBlob, mapInfo] = await Promise.all([
          getOccupancyMapPgmApi(occupancyMapId),
          getOccupancyMapYamlApi(occupancyMapId),
          readOccupancyMapApi(occupancyMapId),
        ])

        // Convert Blob to File
        const pgmFile = new File([pgmBlob], "map.pgm", {
          type: "application/octet-stream",
        })
        const yamlFile = new File([yamlBlob], "map.yaml", {
          type: "application/x-yaml",
        })

        // Parse files
        const [parsedPgmData, parsedYamlData] = await Promise.all([
          loadPgmMap(pgmFile),
          loadYamlMap(yamlFile),
        ])

        setOccupancyMapName(mapInfo.name)
        setPgmMapData(parsedPgmData)
        setYamlMapData(parsedYamlData)
      } catch (error) {
        console.error("Failed to load occupancy map:", error)
      }
    },
    [],
  )

  // Load occupancy map when config.occupancyMapId changes
  useEffect(() => {
    if (config.occupancyMapId) {
      loadOccupancyMapFromApi(config.occupancyMapId)
    }
  }, [config.occupancyMapId, loadOccupancyMapFromApi])

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

    // PGM 맵이 없으면 여기서 종료
    if (!pgmMapData) {
      return {
        canvas,
        ctx,
        canvasWidth,
        canvasHeight,
        mapDrawnLeftBottomX: 0,
        mapDrawnLeftBottomY: 0,
        mapDrawnWidth: 0,
        mapDrawnHeight: 0,
      }
    }

    const dpr = window.devicePixelRatio || 1
    const displayWidth = canvasWidth / dpr
    const displayHeight = canvasHeight / dpr

    // PGM 맵의 비율 계산
    const mapAspectRatio = pgmMapData.width / pgmMapData.height
    const canvasAspectRatio = displayWidth / displayHeight

    let drawWidth: number
    let drawHeight: number
    let offsetX: number
    let offsetY: number

    // 캔버스에 맞게 스케일 조정 (비율 유지)
    if (canvasAspectRatio > mapAspectRatio) {
      // 캔버스가 더 넓은 경우 - 높이를 기준으로 맞추고 양옆 여백
      drawHeight = displayHeight
      drawWidth = drawHeight * mapAspectRatio
      offsetX = (displayWidth - drawWidth) / 2
      offsetY = 0
    } else {
      // 캔버스가 더 높은 경우 - 너비를 기준으로 맞추고 위아래 여백
      drawWidth = displayWidth
      drawHeight = drawWidth / mapAspectRatio
      offsetX = 0
      offsetY = (displayHeight - drawHeight) / 2
    }

    // 이미지 데이터 생성
    const imageData = ctx.createImageData(pgmMapData.width, pgmMapData.height)
    const pixels = imageData.data

    // Grayscale PGM 데이터를 RGBA로 변환
    for (let i = 0; i < pgmMapData.data.length; i++) {
      const value = pgmMapData.data[i]
      const pixelIndex = i * 4
      pixels[pixelIndex] = value // R
      pixels[pixelIndex + 1] = value // G
      pixels[pixelIndex + 2] = value // B
      pixels[pixelIndex + 3] = 255 // A
    }

    // 임시 캔버스에 이미지 데이터 그리기
    const tempCanvas = document.createElement("canvas")
    tempCanvas.width = pgmMapData.width
    tempCanvas.height = pgmMapData.height
    const tempCtx = tempCanvas.getContext("2d")
    if (!tempCtx) return

    tempCtx.putImageData(imageData, 0, 0)

    // 메인 캔버스에 스케일링하여 그리기
    ctx.drawImage(tempCanvas, offsetX, offsetY, drawWidth, drawHeight)

    // 그려진 맵의 왼쪽 하단 좌표 계산 (캔버스 좌표계 기준)
    const mapDrawnLeftBottomX = offsetX
    const mapDrawnLeftBottomY = offsetY + drawHeight

    return {
      canvas,
      ctx,
      canvasWidth,
      canvasHeight,
      mapDrawnLeftBottomX,
      mapDrawnLeftBottomY,
      mapDrawnWidth: drawWidth,
      mapDrawnHeight: drawHeight,
    }
  }

  const drawSingleRobotMarker = (
    ctx: CanvasRenderingContext2D,
    robotId: string,
    pose: ParsedRos2DPose,
    mapDrawnLeftBottomX: number,
    mapDrawnLeftBottomY: number,
    mapDrawnWidth: number,
    mapDrawnHeight: number,
  ) => {
    if (!pgmMapData || !yamlMapData) return

    // 1. ROS 좌표를 PGM 맵 좌표로 변환
    // (로봇 좌표 - origin) / resolution
    const rosX = pose.pose.position.x
    const rosY = pose.pose.position.y
    const originX = yamlMapData.origin[0]
    const originY = yamlMapData.origin[1]
    const resolution = yamlMapData.resolution

    // PGM 맵 좌표계에서의 위치 (픽셀 단위)
    const pgmX = (rosX - originX) / resolution
    const pgmY = (rosY - originY) / resolution

    // 2. PGM 맵 좌표를 캔버스 좌표로 변환
    // PGM 맵의 원점은 왼쪽 하단, 캔버스의 원점은 왼쪽 상단
    // 따라서 Y축을 뒤집어야 함
    const scaleX = mapDrawnWidth / pgmMapData.width
    const scaleY = mapDrawnHeight / pgmMapData.height

    // 캔버스 좌표 계산 (Y축 반전)
    const canvasX = mapDrawnLeftBottomX + pgmX * scaleX
    const canvasY = mapDrawnLeftBottomY - pgmY * scaleY

    // 3. Quaternion을 Yaw 각도로 변환 (2D 회전)
    const quaternion = pose.pose.orientation
    const yaw = Math.atan2(
      2.0 * (quaternion.w * quaternion.z + quaternion.x * quaternion.y),
      1.0 - 2.0 * (quaternion.y * quaternion.y + quaternion.z * quaternion.z),
    )

    // 4. 로봇 마커 그리기
    ctx.save()

    // 빨간 점 그리기
    ctx.fillStyle = "red"
    ctx.beginPath()
    ctx.arc(canvasX, canvasY, 6, 0, Math.PI * 2)
    ctx.fill()

    // 방향 화살표 그리기
    ctx.strokeStyle = "red"
    ctx.lineWidth = 2
    ctx.beginPath()
    const arrowLength = 15
    const arrowEndX = canvasX + Math.cos(yaw) * arrowLength
    const arrowEndY = canvasY - Math.sin(yaw) * arrowLength // Y축 반전
    ctx.moveTo(canvasX, canvasY)
    ctx.lineTo(arrowEndX, arrowEndY)
    ctx.stroke()

    // 화살촉 그리기
    const arrowHeadSize = 5
    const arrowAngle = 0.3
    ctx.beginPath()
    ctx.moveTo(arrowEndX, arrowEndY)
    ctx.lineTo(
      arrowEndX - Math.cos(yaw - arrowAngle) * arrowHeadSize,
      arrowEndY + Math.sin(yaw - arrowAngle) * arrowHeadSize,
    )
    ctx.moveTo(arrowEndX, arrowEndY)
    ctx.lineTo(
      arrowEndX - Math.cos(yaw + arrowAngle) * arrowHeadSize,
      arrowEndY + Math.sin(yaw + arrowAngle) * arrowHeadSize,
    )
    ctx.stroke()

    // 5. 로봇 이름 표시
    const robotName = getRobotName(robotId)
    ctx.fillStyle = "black"
    ctx.font = "12px Arial"
    ctx.fillText(robotName, canvasX + 10, canvasY - 10)

    ctx.restore()
  }

  // 모든 로봇의 마커를 재렌더링
  const drawRobotMarkers = () => {
    const canvasInfo = drawMap()
    if (!canvasInfo) return

    const {
      ctx,
      mapDrawnLeftBottomX,
      mapDrawnLeftBottomY,
      mapDrawnWidth,
      mapDrawnHeight,
    } = canvasInfo

    const activeRobotRos2DPoses = robotRos2DPoses.filter(({robotId}) => {
      return connections ? connections[robotId] : false
    })

    for (const {robotId, pose} of activeRobotRos2DPoses) {
      drawSingleRobotMarker(
        ctx,
        robotId,
        pose,
        mapDrawnLeftBottomX,
        mapDrawnLeftBottomY,
        mapDrawnWidth,
        mapDrawnHeight,
      )
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
  }, [pgmMapData])

  useEffect(() => {
    drawRobotMarkers()
  }, [robotRos2DPoses, pgmMapData])

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
        footerInfo={
          occupancyMapName
            ? [{label: "Map", value: occupancyMapName}]
            : undefined
        }
      >
        {!config.occupancyMapId && (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            height="100%"
            width="100%"
            bg="gray.50"
            borderRadius="8px"
            border="1px dashed"
            borderColor="gray.300"
          >
            <Text color="gray.500" fontSize="sm" textAlign="center" px={4}>
              No occupancy map selected.
              <br/>
              Please select a map in the widget settings.
            </Text>
          </Box>
        )}
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
