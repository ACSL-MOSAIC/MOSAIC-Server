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
    console.log("LiDARPointCloud22DWidget 마운트:", {
      robotId,
      dataType,
      store,
    })

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
      console.log("Go2OusterPointCloudWidget 언마운트")
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

    // 현재 캔버스의 표시 크기를 가져와서 설정
    // const rect = canvas.getBoundingClientRect()
    // const canvasWidth = Math.floor(rect.width)
    // const canvasHeight = Math.floor(rect.height)
    // canvas.width = canvasWidth
    // canvas.height = canvasHeight

    const canvasWidth = canvas.width
    const canvasHeight = canvas.height

    // 배경을 검은색으로 설정
    ctx.fillStyle = "black"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // 2D 투영을 위한 깊이 맵과 높이 맵 초기화
    const depthMap = new Array(canvasWidth * canvasHeight).fill(
      Number.POSITIVE_INFINITY,
    )
    const heightMap = new Array(canvasWidth * canvasHeight).fill(0)

    let maxDistance = 0
    let minHeight = Number.POSITIVE_INFINITY
    let maxHeight = Number.NEGATIVE_INFINITY

    for (let i = 0; i < data.datas.length; i++) {
      const pointData = data.datas[i]
      const x = pointData.x
      const y = pointData.y
      const z = pointData.z
      if (x === null || y === null || z === null) {
        continue
      }

      // 거리 계산
      const distance = Math.sqrt(x * x + y * y + z * z)
      if (distance === 0) continue

      // 구면 좌표계로 변환
      const azimuth = Math.atan2(y, x) // -pi ~ pi 라디안
      const elevation = Math.asin(z / distance) // -pi/2 ~ pi/2 라디안

      // 2D 이미지 좌표로 매핑
      // azimuth: -180° ~ +180° → 0 ~ canvasWidth
      const u = Math.floor(((azimuth + Math.PI) / (2 * Math.PI)) * canvasWidth)
      // elevation: -45° ~ +45° → canvasHeight ~ 0 (상하 반전)
      const v = Math.floor(
        ((-elevation + Math.PI / 4) / (Math.PI / 2)) * canvasHeight,
      )

      // 범위 체크
      if (u >= 0 && u < canvasWidth && v >= 0 && v < canvasHeight) {
        const pixelIndex = v * canvasWidth + u
        // 같은 픽셀에 여러 포인트가 매핑될 경우 가장 가까운 거리 사용
        if (distance < depthMap[pixelIndex]) {
          depthMap[pixelIndex] = distance
          heightMap[pixelIndex] = z
          maxDistance = Math.max(maxDistance, distance)
          minHeight = Math.min(minHeight, z)
          maxHeight = Math.max(maxHeight, z)
        }
      }
    }

    // maxDistance가 0인 경우 기본값 설정
    if (maxDistance === 0) maxDistance = 1
    // 높이 범위가 0인 경우 기본값 설정
    const heightRange = maxHeight - minHeight
    if (heightRange === 0) {
      minHeight = -1
      maxHeight = 1
    }

    // 이미지 데이터 생성
    const imageData = ctx.createImageData(canvas.width, canvas.height)

    // 깊이 맵과 높이 맵을 이미지로 변환
    for (let pixelIndex = 0; pixelIndex < depthMap.length; pixelIndex++) {
      // 깊이 정규화
      const normalizedDepth =
        depthMap[pixelIndex] === Number.POSITIVE_INFINITY
          ? 0
          : depthMap[pixelIndex] / maxDistance
      // 높이 정규화
      const normalizedHeight =
        depthMap[pixelIndex] === Number.POSITIVE_INFINITY
          ? 0
          : (heightMap[pixelIndex] - minHeight) / (maxHeight - minHeight)

      const { r, g, b } = depthAndHeightToRGB(normalizedDepth, normalizedHeight)

      // 이미지 데이터에 컬러맵 값 설정
      const imageIndex = pixelIndex * 4
      imageData.data[imageIndex] = r // R
      imageData.data[imageIndex + 1] = g // G
      imageData.data[imageIndex + 2] = b // B
      imageData.data[imageIndex + 3] = 255 // A
    }

    // 이미지 데이터를 캔버스에 그리기
    ctx.putImageData(imageData, 0, 0)
    setPointCount(data.datas.length)
    setLastUpdate(new Date())
  }

  const depthAndHeightToRGB = (
    depth: number,
    height: number,
  ): { r: number; g: number; b: number } => {
    // 빈 부분 (거리 정보가 없는 부분)
    if (depth === 0) {
      return { r: 0, g: 0, b: 0 } // 검은색
    }

    // HSV 색공간을 사용하여 자연스러운 색상 매핑
    // Hue: 거리에 따라 변경 (가까운 거리: 빨간색(0°) -> 먼 거리: 파란색(240°))
    const hue = (1 - depth) * 240 // 0° (빨강) ~ 240° (파랑)
    
    // Saturation: 높이에 따라 변경 (낮은 높이: 채도 낮음, 높은 높이: 채도 높음)
    const saturation = 0.5 + height * 0.5 // 0.5 ~ 1.0
    
    // Value: 거리와 높이 조합으로 밝기 조절
    const value = 0.6 + (1 - depth) * 0.3 + height * 0.1 // 0.6 ~ 1.0
    
    // HSV to RGB 변환
    const { r, g, b } = hsvToRgb(hue / 360, saturation, value)
    
    return { r: Math.floor(r * 255), g: Math.floor(g * 255), b: Math.floor(b * 255) }
  }

  const hsvToRgb = (h: number, s: number, v: number): { r: number; g: number; b: number } => {
    const c = v * s
    const x = c * (1 - Math.abs(((h * 6) % 2) - 1))
    const m = v - c
    
    let r = 0
    let g = 0
    let b = 0
    
    if (h < 1/6) {
      r = c; g = x; b = 0
    } else if (h < 2/6) {
      r = x; g = c; b = 0
    } else if (h < 3/6) {
      r = 0; g = c; b = x
    } else if (h < 4/6) {
      r = 0; g = x; b = c
    } else if (h < 5/6) {
      r = x; g = 0; b = c
    } else {
      r = c; g = 0; b = x
    }
    
    return {
      r: r + m,
      g: g + m,
      b: b + m
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
              height: "100%",
              objectFit: "contain",
              borderRadius: "6px",
            }}
          />
        </Box>
      )}
    </WidgetFrame>
  )
}
