import type { ParsedPointCloud2 } from "@/dashboard/parser/lidar-pointcloud.ts"
import type { LidarPointCloudStore } from "@/dashboard/store/data-channel-store/readonly/lidar-point-cloud.store.ts"
import { Box, Flex } from "@chakra-ui/react"
import { useEffect, useRef, useState } from "react"
import { WidgetFrame } from "./WidgetFrame"
import type { WidgetProps } from "./types"

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
      console.error("PointCloud2 스토어가 없습니다:", { robotId, dataType })
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

    const rect = canvas.getBoundingClientRect()
    const canvasWidth = Math.floor(rect.width)
    const canvasHeight = Math.floor(rect.height)

    canvas.width = canvasWidth
    canvas.height = canvasHeight

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

      const distance = Math.sqrt(x * x + y * y)
      if (distance === 0) continue

      // 높이: 전체 높이 범위를 캔버스 높이에 매핑 (위쪽이 높은 높이)
      // 일단 임시로 매핑하고, 나중에 전체 범위를 알면 다시 매핑

      maxDistance = Math.max(maxDistance, distance)
      minHeight = Math.min(minHeight, z)
      maxHeight = Math.max(maxHeight, z)
      minIntensity = Math.min(minIntensity, intensity)
      maxIntensity = Math.max(maxIntensity, intensity)
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

        const { r, g, b } = createDistinctiveColor(
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
    // Depth 기반 색상 + Intensity 변화 매핑:
    // depth가 주요 색상을 결정하고, intensity는 미세한 변화만 적용
    // intensity가 0이어도 depth 기반 색상은 확실히 보이도록 함

    // 기본 Hue: 거리에 따라 무지개 색상 (확실한 색상 보장)
    // 0 (가장 가까움) -> 0° (빨강)
    // 1 (가장 멀음) -> 240° (파랑)
    const baseHue = depth * 240 // 0° ~ 240° (빨강 -> 파랑)

    // Intensity로 색상에 아주 미세한 변화만 추가 (±15도로 줄임)
    const intensityOffset = (intensity - 0.5) * 30 // -15° ~ +15°
    const hue = (baseHue + intensityOffset + 360) % 360

    // Saturation: intensity가 0이어도 충분한 채도 보장
    const saturation = 0.7 + intensity * 0.3 // 0.7 ~ 1.0 (기본 채도를 높게)

    // Value: intensity가 0이어도 충분히 밝게, 거리 기반으로 주요 밝기 결정
    const depthBrightness = 0.6 + (1 - depth) * 0.3 // 거리 기반 기본 밝기 (0.6 ~ 0.9)
    const intensityBoost = intensity * 0.1 // intensity로 최대 0.1만 추가
    const heightBoost = height * 0.05 // 높이로 최대 0.05만 추가

    const value = Math.min(depthBrightness + intensityBoost + heightBoost, 1.0)

    // HSV to RGB 변환
    const { r, g, b } = hsvToRgb(hue / 360, saturation, value)

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
