import type {ParsedPointCloud2} from "@/dashboard/parser/lidar-pointcloud.ts"
import type {LidarPointCloudStore} from "@/dashboard/store/data-channel-store/readonly/lidar-point-cloud.store.ts"
import {Box, Flex} from "@chakra-ui/react"
import {useEffect, useRef, useState} from "react"
import {WidgetFrame} from "../WidgetFrame"
import type {WidgetProps} from "../types"

export interface LiDARPointCloud22DWidgetProps extends WidgetProps {
  store: LidarPointCloudStore
}

export function LiDARPointCloud22DWidget({
                                           robotId,
                                           store,
                                           dataType,
                                           onRemove,
                                         }: LiDARPointCloud22DWidgetProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pointCount, setPointCount] = useState(0)
  const [fps, setFps] = useState(0)

  useEffect(() => {
    // console.log("LiDARPointCloud22DWidget 마운트:", {
    //   robotId,
    //   dataType,
    //   store,
    // })

    if (!store) {
      console.error("PointCloud2 스토어가 없습니다:", {robotId, dataType})
      setError("PointCloud2 스토어를 찾을 수 없습니다.")
      return
    }

    const unsubscribe = store.subscribe((data: ParsedPointCloud2) => {
      if (!data) {
        // skip if no data
        return
      }
      setIsConnected(true)

      if (!canvasRef.current) {
        // skip if canvas is not ready
        return
      }

      try {
        setIsConnected(true)
        setError(null)

        const pointStep = data.pointStep

        if (!pointStep || !data.datas || data.datas.length === 0) {
          setError("잘못된 포인트 클라우드 데이터입니다.")
          return
        }

        setPointCount(data.datas.length)
        setFps(store.fps)

        drawPoint(data)
      } catch (error) {
        console.error("PointCloud2 처리 중 오류:", error)
        setError(
          `PointCloud2 처리 중 오류: ${error instanceof Error ? error.message : String(error)}`,
        )
      }
    })

    return () => {
      // console.log("Go2OusterPointCloudWidget 언마운트")
      unsubscribe()
    }
  }, [store, robotId, dataType])

  const drawPoint = (data: ParsedPointCloud2) => {
    const canvas = canvasRef.current
    if (!canvas) {
      setError("캔버스를 찾을 수 없습니다.")
      return
    }
    const ctx = canvas.getContext("2d")
    if (!ctx) {
      setError("캔버스 컨텍스트를 가져올 수 없습니다.")
      return
    }

    // 캔버스의 실제 표시 크기를 가져와서 내부 해상도 설정
    const rect = canvas.getBoundingClientRect()
    const canvasWidth = Math.floor(rect.width)
    const canvasHeight = Math.floor(rect.height)

    // 캔버스의 내부 해상도를 실제 표시 크기로 설정
    canvas.width = canvasWidth
    canvas.height = canvasHeight

    // 최소 크기 체크
    if (canvasWidth <= 0 || canvasHeight <= 0) {
      return
    }

    // 배경을 검은색으로 설정
    ctx.fillStyle = "black"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // 2D 투영을 위한 깊이 맵, 높이 맵, 강도 맵 초기화
    const depthMap = new Array(canvasWidth * canvasHeight).fill(
      Number.POSITIVE_INFINITY,
    )
    const heightMap = new Array(canvasWidth * canvasHeight).fill(0)
    const intensityMap = new Array(canvasWidth * canvasHeight).fill(0)

    let maxDistance = 0
    let minHeight = Number.POSITIVE_INFINITY
    let maxHeight = Number.NEGATIVE_INFINITY
    let minIntensity = Number.POSITIVE_INFINITY
    let maxIntensity = Number.NEGATIVE_INFINITY

    // 첫 번째 패스: 범위 찾기 및 투영
    for (let i = 0; i < data.datas.length; i++) {
      const pointData = data.datas[i]
      const x = pointData.x
      const y = pointData.y
      const z = pointData.z
      const intensity = pointData.intensity || 0

      if (x === null || y === null || z === null) {
        continue
      }

      // 거리 계산 (XY 평면에서의 거리)
      const distance = Math.sqrt(x * x + y * y)
      if (distance === 0) continue

      // 방위각 계산: 정면(+X축)을 기준으로 시계방향
      const azimuth = Math.atan2(y, x) // -π ~ π

      // 2D 이미지 좌표로 매핑
      // azimuth: -π(-180°) ~ π(+180°) → 0 ~ canvasWidth
      const u = Math.floor(((azimuth + Math.PI) / (2 * Math.PI)) * canvasWidth)

      // 범위 체크 및 데이터 수집
      if (u >= 0 && u < canvasWidth) {
        maxDistance = Math.max(maxDistance, distance)
        minHeight = Math.min(minHeight, z)
        maxHeight = Math.max(maxHeight, z)
        minIntensity = Math.min(minIntensity, intensity)
        maxIntensity = Math.max(maxIntensity, intensity)
      }
    }

    // 기본값 설정
    if (maxDistance === 0) maxDistance = 1
    const heightRange = maxHeight - minHeight
    if (heightRange === 0) {
      minHeight = -1
      maxHeight = 1
    }
    const intensityRange = maxIntensity - minIntensity
    if (intensityRange === 0) {
      minIntensity = 0
      maxIntensity = 1
    }

    // 두 번째 패스: 실제 투영 및 매핑
    for (let i = 0; i < data.datas.length; i++) {
      const pointData = data.datas[i]
      const x = pointData.x
      const y = pointData.y
      const z = pointData.z
      const intensity = pointData.intensity || 0

      if (x === null || y === null || z === null) {
        continue
      }

      const distance = Math.sqrt(x * x + y * y)
      if (distance === 0) continue

      const azimuth = Math.atan2(y, x)
      const u = Math.floor(((azimuth + Math.PI) / (2 * Math.PI)) * canvasWidth)

      // 높이를 캔버스 Y좌표로 매핑 (위쪽이 높은 높이)
      const v = Math.floor(
        ((maxHeight - z) / (maxHeight - minHeight)) * (canvasHeight - 1),
      )

      // 범위 체크
      if (u >= 0 && u < canvasWidth && v >= 0 && v < canvasHeight) {
        const pixelIndex = v * canvasWidth + u
        // 같은 픽셀에 여러 포인트가 매핑될 경우 가장 가까운 거리 사용
        if (distance < depthMap[pixelIndex]) {
          depthMap[pixelIndex] = distance
          heightMap[pixelIndex] = z
          intensityMap[pixelIndex] = intensity
        }
      }
    }

    // 이미지 데이터 생성
    const imageData = ctx.createImageData(canvas.width, canvas.height)

    // 깊이 맵, 높이 맵, 강도 맵을 이미지로 변환
    for (let pixelIndex = 0; pixelIndex < depthMap.length; pixelIndex++) {
      if (depthMap[pixelIndex] === Number.POSITIVE_INFINITY) {
        // 빈 픽셀은 검은색
        const imageIndex = pixelIndex * 4
        imageData.data[imageIndex] = 0 // R
        imageData.data[imageIndex + 1] = 0 // G
        imageData.data[imageIndex + 2] = 0 // B
        imageData.data[imageIndex + 3] = 255 // A
      } else {
        // 정규화
        const normalizedDepth = depthMap[pixelIndex] / maxDistance
        const normalizedHeight =
          (heightMap[pixelIndex] - minHeight) / (maxHeight - minHeight)
        const normalizedIntensity =
          (intensityMap[pixelIndex] - minIntensity) /
          (maxIntensity - minIntensity)

        const {r, g, b} = createDistinctiveColor(
          normalizedDepth,
          normalizedHeight,
          normalizedIntensity,
        )

        // 이미지 데이터에 컬러 값 설정
        const imageIndex = pixelIndex * 4
        imageData.data[imageIndex] = r // R
        imageData.data[imageIndex + 1] = g // G
        imageData.data[imageIndex + 2] = b // B
        imageData.data[imageIndex + 3] = 255 // A
      }
    }

    // 이미지 데이터를 캔버스에 그리기
    ctx.putImageData(imageData, 0, 0)
    setPointCount(data.datas.length)
    setLastUpdate(new Date())
  }

  const createDistinctiveColor = (
    depth: number,
    height: number,
    intensity: number,
  ): { r: number; g: number; b: number } => {
    // 높이차 중심 색상 매핑:
    // 1. 높이(height)를 주요 색상(Hue)으로 사용 - 지형/물체 높이 구분
    // 2. 거리(depth)로 색상에 보조적 변화 추가
    // 3. 강도(intensity)로 밝기와 채도 조절

    // 기본 Hue: 높이에 따라 무지개 색상 (가장 중요한 요소)
    // 0 (가장 낮음) -> 240° (파랑 - 바닥/낮은 곳)
    // 1 (가장 높음) -> 0° (빨강 - 높은 곳/장애물)
    const baseHue = (1 - height) * 240 // 높을수록 빨강, 낮을수록 파랑

    // 거리로 색상에 보조적 변화 추가 (±20도 범위)
    const adjustedDepth = Math.sqrt(depth) // 거리 분포 보정
    const depthOffset = (adjustedDepth - 0.5) * 40 // -20° ~ +20°

    // Intensity로 추가 미세 조정 (±10도 범위)
    const intensityOffset = (intensity - 0.5) * 20 // -10° ~ +10°

    const hue = (baseHue + depthOffset + intensityOffset + 360) % 360

    // Saturation: 높이차가 클수록 더 선명하게, intensity로 추가 보정
    const baseSaturation = 0.6 + height * 0.3 // 높을수록 더 선명
    const intensitySaturation = intensity * 0.1 // intensity로 미세 조정
    const saturation = Math.min(baseSaturation + intensitySaturation, 1.0)

    // Value: 높이와 거리 조합으로 밝기 조절
    // 높은 곳 + 가까운 거리일수록 더 밝게
    const heightBrightness = 0.5 + height * 0.3 // 높이 기반 밝기 (0.5 ~ 0.8)
    const depthBrightness = (1 - adjustedDepth) * 0.2 // 거리 기반 밝기 (0 ~ 0.2)
    const intensityBoost = intensity * 0.1 // intensity 보정 (0 ~ 0.1)

    const value = Math.min(
      heightBrightness + depthBrightness + intensityBoost,
      1.0,
    )

    // HSV to RGB 변환
    const {r, g, b} = hsvToRgb(hue / 360, saturation, value)

    return {
      r: Math.floor(r * 255),
      g: Math.floor(g * 255),
      b: Math.floor(b * 255),
    }
  }

  const hsvToRgb = (
    h: number,
    s: number,
    v: number,
  ): { r: number; g: number; b: number } => {
    const c = v * s
    const x = c * (1 - Math.abs(((h * 6) % 2) - 1))
    const m = v - c

    let r = 0
    let g = 0
    let b = 0

    if (h < 1 / 6) {
      r = c
      g = x
      b = 0
    } else if (h < 2 / 6) {
      r = x
      g = c
      b = 0
    } else if (h < 3 / 6) {
      r = 0
      g = c
      b = x
    } else if (h < 4 / 6) {
      r = 0
      g = x
      b = c
    } else if (h < 5 / 6) {
      r = x
      g = 0
      b = c
    } else {
      r = c
      g = 0
      b = x
    }

    return {
      r: r + m,
      g: g + m,
      b: b + m,
    }
  }

  // Footer info
  const footerInfo = [
    {
      label: "Points",
      value: pointCount.toLocaleString(),
    },
    ...(lastUpdate
      ? [
        {
          label: "Last Update",
          value: lastUpdate.toLocaleTimeString(),
        },
        {
          label: "FPS",
          value: fps.toFixed(1),
        },
      ]
      : []),
  ]

  return (
    <WidgetFrame
      title="LiDAR PointCloud to 2D"
      robot_id={robotId}
      isConnected={isConnected && store.getChannelInfo().state === "open"}
      footerInfo={footerInfo}
      footerMessage={
        isConnected ? "PointCloud data active" : "Waiting for data..."
      }
      onRemove={onRemove}
    >
      {error ? (
        <Flex
          direction="column"
          align="center"
          justify="center"
          h="100%"
          color="red.500"
          textAlign="center"
        >
          <Box fontSize="2xl" mb={2}>
            ⚠️
          </Box>
          <Box fontSize="sm">{error}</Box>
        </Flex>
      ) : (
        <Box
          width="100%"
          height="100%"
          position="relative"
          display="flex"
          flexDirection="column"
          justifyContent="center"
          alignItems="center"
          bg="black"
          borderRadius="md"
        >
          {/* Angle indicators */}
          <Box
            position="relative"
            width="100%"
            height="20px"
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            px={2}
            mb={1}
          >
            <Box fontSize="10px" color="gray.300" position="absolute" left="2">
              -180°
            </Box>
            <Box
              fontSize="10px"
              color="gray.300"
              position="absolute"
              left="25%"
            >
              -90°
            </Box>
            <Box
              fontSize="10px"
              color="gray.300"
              position="absolute"
              left="50%"
              transform="translateX(-50%)"
            >
              0°
            </Box>
            <Box
              fontSize="10px"
              color="gray.300"
              position="absolute"
              right="25%"
            >
              90°
            </Box>
            <Box fontSize="10px" color="gray.300" position="absolute" right="2">
              180°
            </Box>
          </Box>

          <canvas
            ref={canvasRef}
            style={{
              width: "100%",
              height: "calc(100% - 20px)",
              objectFit: "contain",
              borderRadius: "6px",
            }}
          />
        </Box>
      )}
    </WidgetFrame>
  )
}
