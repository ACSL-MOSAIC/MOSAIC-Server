import type { ParsedPointCloud2 } from "@/dashboard/parser/go2-ouster-pointcloud.ts"
import type { Go2OusterPointCloudStore } from "@/dashboard/store/data-channel-store/readonly/go2-ouster-pointcloud.store.ts"
import { Box, Flex } from "@chakra-ui/react"
import { useEffect, useRef, useState } from "react"
import { WidgetFrame } from "./WidgetFrame"
import type { WidgetProps } from "./types"

export interface Go2OusterPointCloudWidgetProps extends WidgetProps {
  store: Go2OusterPointCloudStore
}

export function Go2OusterPointCloudWidget({
  robotId,
  store,
  dataType,
  onRemove,
}: Go2OusterPointCloudWidgetProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [pointCount, setPointCount] = useState(0)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

  useEffect(() => {
    console.log("Go2OusterPointCloudWidget 마운트:", {
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
      if (!canvasRef.current || !data) {
        return
      }

      try {
        setIsConnected(true)
        setError(null)

        // base64 문자열을 바이너리로 변환
        const binaryData = atob(data.data as unknown as string)
        const pointData = new Uint8Array(binaryData.length)
        for (let i = 0; i < binaryData.length; i++) {
          pointData[i] = binaryData.charCodeAt(i)
        }

        const pointStep = data.pointStep

        if (!data.width || !data.height || !pointStep) {
          setError("잘못된 포인트 클라우드 차원입니다.")
          return
        }

        setDimensions({ width: data.width, height: data.height })

        const canvas = canvasRef.current
        const ctx = canvas.getContext("2d")
        if (!ctx) {
          setError("캔버스 컨텍스트를 가져올 수 없습니다.")
          return
        }

        // 캔버스 크기 설정 (가로 2배, 세로 4배로 확대)
        const scaleX = 2
        const scaleY = 4
        const channelGap = 16 // 채널 간 여백
        canvas.width = data.width * scaleX
        canvas.height = data.height * scaleY + (data.height - 1) * channelGap

        // 배경을 검은색으로 설정
        ctx.fillStyle = "black"
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        // 이미지 데이터 생성
        const imageData = ctx.createImageData(canvas.width, canvas.height)

        // 각 채널별로 독립적인 깊이 맵과 intensity 맵 초기화
        const channelMaps = Array.from({ length: data.height || 0 }, () => ({
          depthMap: new Array(data.width || 0).fill(Number.POSITIVE_INFINITY),
          intensityMap: new Array(data.width || 0).fill(0),
        }))

        let processedPoints = 0
        let errorPoints = 0

        // 각 포인트의 데이터 처리
        for (let i = 0; i < (data.width || 0) * (data.height || 0); i++) {
          const offset = i * (pointStep || 0)

          try {
            // x, y, z 좌표 추출
            const x = new Float32Array(
              pointData.slice(offset, offset + 4).buffer,
            )[0]
            const y = new Float32Array(
              pointData.slice(offset + 4, offset + 8).buffer,
            )[0]
            const z = new Float32Array(
              pointData.slice(offset + 8, offset + 12).buffer,
            )[0]
            const intensity = new Float32Array(
              pointData.slice(offset + 16, offset + 20).buffer,
            )[0]

            // 거리 계산
            const distance = Math.sqrt(x * x + y * y + z * z)

            // 구면 좌표계로 변환
            const azimuth = Math.atan2(y, x) // -pi ~ pi

            // 이미지 좌표로 매핑 (채널별로 독립적으로 처리)
            const channel = Math.floor(i / (data.width || 1)) // 현재 채널
            const u = Math.floor(
              ((azimuth + Math.PI) / (2 * Math.PI)) * (data.width || 0),
            )

            // 범위 체크
            if (u >= 0 && u < (data.width || 0) && channelMaps[channel]) {
              // 같은 픽셀에 여러 포인트가 매핑될 경우 가장 가까운 거리 사용
              if (distance < channelMaps[channel].depthMap[u]) {
                channelMaps[channel].depthMap[u] = distance
                channelMaps[channel].intensityMap[u] = intensity
              }
            }

            processedPoints++
          } catch (error) {
            errorPoints++
          }
        }

        setPointCount(processedPoints)

        // 각 채널별 최대 거리 찾기
        const maxDistances = channelMaps.map(
          (channelMap) =>
            Math.max(
              ...channelMap.depthMap.filter(
                (d) => d !== Number.POSITIVE_INFINITY,
              ),
            ) || 1,
        )

        // 깊이 맵과 intensity 맵을 이미지로 변환
        for (let channel = 0; channel < data.height; channel++) {
          const maxDistance = maxDistances[channel]
          const channelMap = channelMaps[channel]

          if (!channelMap) continue

          for (let u = 0; u < data.width; u++) {
            // 깊이와 intensity 정규화
            const normalizedDepth =
              channelMap.depthMap[u] === Number.POSITIVE_INFINITY
                ? 0
                : channelMap.depthMap[u] / maxDistance
            const normalizedIntensity = Math.min(
              Math.max(channelMap.intensityMap[u] / 255, 0),
              1,
            )

            // 컬러맵 적용 (깊이와 intensity를 혼합)
            let r = 0
            let g = 0
            let b = 0

            // 깊이에 따른 색상 (파란색 -> 청록색 -> 노란색 -> 빨간색)
            if (normalizedDepth < 0.25) {
              const t = normalizedDepth * 4
              r = 0
              g = t * 255
              b = 255
            } else if (normalizedDepth < 0.5) {
              const t = (normalizedDepth - 0.25) * 4
              r = t * 255
              g = 255
              b = (1 - t) * 255
            } else if (normalizedDepth < 0.75) {
              const t = (normalizedDepth - 0.5) * 4
              r = 255
              g = (1 - t * 0.5) * 255
              b = 0
            } else {
              const t = (normalizedDepth - 0.75) * 4
              r = 255
              g = (0.5 - t * 0.5) * 255
              b = 0
            }

            // intensity로 밝기 조절
            const brightness = 0.5 + normalizedIntensity * 0.5
            r = Math.floor(r * brightness)
            g = Math.floor(g * brightness)
            b = Math.floor(b * brightness)

            // 이미지 데이터에 컬러맵 값 설정 (확대 배율 적용)
            const yOffset = channel * (scaleY + channelGap)
            for (let sy = 0; sy < scaleY; sy++) {
              for (let sx = 0; sx < scaleX; sx++) {
                const pixelIndex =
                  ((yOffset + sy) * canvas.width + (u * scaleX + sx)) * 4
                imageData.data[pixelIndex] = r // R
                imageData.data[pixelIndex + 1] = g // G
                imageData.data[pixelIndex + 2] = b // B
                imageData.data[pixelIndex + 3] = 255 // A
              }
            }
          }
        }

        // 이미지 데이터를 캔버스에 그리기
        ctx.putImageData(imageData, 0, 0)
        setLastUpdate(new Date())
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

  // Footer info
  const footerInfo = [
    {
      label: "Points",
      value: pointCount.toLocaleString(),
    },
    {
      label: "Dimensions",
      value: `${dimensions.width} × ${dimensions.height}`,
    },
    {
      label: "Data Type",
      value: (dataType || "unknown").toUpperCase(),
    },
    ...(lastUpdate
      ? [
          {
            label: "Last Update",
            value: lastUpdate.toLocaleTimeString(),
          },
        ]
      : []),
  ]

  return (
    <WidgetFrame
      title="Go2 Ouster PointCloud"
      robot_id={robotId}
      isConnected={isConnected}
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
          justifyContent="center"
          alignItems="center"
          bg="black"
          borderRadius="md"
        >
          <canvas
            ref={canvasRef}
            style={{
              maxWidth: "100%",
              maxHeight: "100%",
              objectFit: "contain",
              borderRadius: "6px",
            }}
          />
        </Box>
      )}
    </WidgetFrame>
  )
}
