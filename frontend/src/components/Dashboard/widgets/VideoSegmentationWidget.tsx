import { VideoObjectDetectionSetting } from "@/components/Dashboard/widgets/VideoObjectDetectionSetting.tsx"
import {
  type StreamStats,
  type VideoData,
  getInitialStreamStats,
  getInitialVideoData,
} from "@/dashboard/store/media-channel-store/video-store"
import { VideoStoreManager } from "@/dashboard/store/media-channel-store/video-store-manager.ts"
import { Box, Flex, IconButton } from "@chakra-ui/react"
import * as cocoSsd from "@tensorflow-models/coco-ssd"
import * as tf from "@tensorflow/tfjs"
import type React from "react"
import { useCallback } from "react"
import { useEffect, useRef, useState } from "react"
import { WidgetFrame } from "./WidgetFrame"

interface Detection {
  class: string
  score: number
  bbox: [number, number, number, number]
}

export interface VideoSegmentationWidgetConfig {
  stream_id: string
  tf_model: string
}

interface VideoSegmentationWidgetProps {
  robotId: string
  config: VideoSegmentationWidgetConfig
  onUpdateConfig?: (newConfig: VideoSegmentationWidgetConfig) => void
  setOpenSetting?: (openSetting: boolean) => void
  onRemove?: () => void
}

interface ErrorWidgetProps extends VideoSegmentationWidgetProps {
  openSetting: boolean
  message: string
}

const ErrorWidget: React.FC<ErrorWidgetProps> = ({
  robotId,
  config,
  onUpdateConfig,
  openSetting,
  setOpenSetting,
  onRemove,
  message,
}) => (
  <>
    <WidgetFrame
      title="Video Object Detection"
      robot_id={robotId}
      isConnected={false}
      footerMessage={message}
      onSettingClick={() => {
        setOpenSetting?.(true)
      }}
      onRemove={onRemove}
    >
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
        <Box fontSize="sm">{message}</Box>
      </Flex>
    </WidgetFrame>
    {openSetting && (
      <VideoObjectDetectionSetting
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

export const VideoObjectDetectionWidget: React.FC<
  VideoObjectDetectionWidgetProps
> = ({ robotId, config, onUpdateConfig, onRemove }) => {
  const videoStoreManager = VideoStoreManager.getInstance()

  const [openSetting, setOpenSetting] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [videoData, setVideoData] = useState<VideoData | null>(
    getInitialVideoData(),
  )
  const [streamStats, setStreamStats] = useState<StreamStats>(
    getInitialStreamStats(),
  )
  const [isPlaying, setIsPlaying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  // Object Detection 관련 상태
  const [model, setModel] = useState<any>(null)
  const [isModelLoading, setIsModelLoading] = useState(true)
  const [isDetecting, setIsDetecting] = useState(false)
  const [detections, setDetections] = useState<Detection[]>([])
  const animationFrameRef = useRef<number | null>(null)

  const store = videoStoreManager.createVideoStoreByMediaTypeAuto(
    robotId,
    config?.stream_id,
  )

  // TensorFlow.js 초기화 및 모델 로드
  useEffect(() => {
    const initializeTensorFlow = async () => {
      try {
        setIsModelLoading(true)

        // TensorFlow.js 백엔드 초기화
        await tf.ready()
        console.log("✅ TensorFlow.js ready")

        // COCO-SSD 모델 로드
        const loadedModel = await cocoSsd.load()
        setModel(loadedModel)
        setIsModelLoading(false)
        console.log("✅ COCO-SSD model loaded successfully")
      } catch (err) {
        console.error("❌ TensorFlow initialization failed:", err)
        setError("Failed to initialize TensorFlow.js or load model")
        setIsModelLoading(false)
      }
    }

    initializeTensorFlow()
  }, [])

  // 캔버스 설정
  const setupCanvas = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current
      const video = videoRef.current

      canvas.width = video.videoWidth || video.offsetWidth
      canvas.height = video.videoHeight || video.offsetHeight
      canvas.style.width = `${video.offsetWidth}px`
      canvas.style.height = `${video.offsetHeight}px`
    }
  }, [])

  // 객체 탐지
  const detectObjects = useCallback(async () => {
    if (!isDetecting || !model || !videoRef.current || !canvasRef.current) {
      return
    }

    try {
      const video = videoRef.current
      const canvas = canvasRef.current
      const ctx = canvas.getContext("2d")

      if (!ctx || video.readyState !== 4) {
        // 다음 프레임에서 재시도
        animationFrameRef.current = requestAnimationFrame(() => {
          setTimeout(detectObjects, 100)
        })
        return
      }

      // 캔버스 클리어
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // 객체 탐지 수행
      const predictions = await model.detect(video)

      // 탐지 결과 필터링 및 변환 (타입 안전성 확보)
      const filteredDetections: Detection[] = predictions
        .filter((prediction: cocoSsd.DetectedObject) => prediction.score > 0.5)
        .map((prediction: cocoSsd.DetectedObject) => ({
          class: prediction.class,
          score: prediction.score,
          bbox: prediction.bbox,
        }))

      setDetections(filteredDetections)
      drawDetections(ctx, filteredDetections)
    } catch (err) {
      console.error("Detection error:", err)
    }

    // 다음 프레임 스케줄링 (10FPS)
    if (isDetecting) {
      animationFrameRef.current = requestAnimationFrame(() => {
        setTimeout(detectObjects, 100)
      })
    }
  }, [isDetecting, model])

  // 탐지 결과 그리기
  const drawDetections = (
    ctx: CanvasRenderingContext2D,
    detections: Detection[],
  ) => {
    ctx.strokeStyle = "#00ff00"
    ctx.lineWidth = 3
    ctx.font = "35px Arial"
    ctx.fillStyle = "#00ff00"
    ctx.shadowColor = "rgba(0, 0, 0, 0.5)"
    ctx.shadowOffsetX = 1
    ctx.shadowOffsetY = 1

    detections.forEach((detection) => {
      const [x, y, width, height] = detection.bbox

      // 바운딩 박스 그리기
      ctx.strokeRect(x, y, width, height)

      // 라벨과 신뢰도 그리기
      const label = `${detection.class} ${(detection.score * 100).toFixed(1)}%`
      const textWidth = ctx.measureText(label).width
      const textHeight = 35

      const padding = 5
      const backgroundHeight = textHeight + padding * 2

      // 배경 사각형
      ctx.fillStyle = "rgba(0, 255, 0, 0.8)"
      ctx.fillRect(
        x,
        y - backgroundHeight,
        textWidth + padding * 2,
        backgroundHeight,
      )

      // 텍스트
      ctx.fillStyle = "#000000"
      ctx.shadowColor = "transparent"
      ctx.fillText(label, x + padding, y - padding)
      ctx.shadowColor = "rgba(0, 0, 0, 0.5)"
    })
  }

  // 탐지 자동 시작
  useEffect(() => {
    console.log("Current state:", { model, isConnected, isPlaying })
    if (model && isConnected && isPlaying) {
      setIsDetecting(true)
      // detectObjects 호출을 다음 렌더링 사이클로 지연
      const timer = setTimeout(detectObjects, 0)
      return () => clearTimeout(timer)
    }
    setIsDetecting(false)
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    // 캔버스 클리어
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d")
      ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
    }
    setDetections([])
  }, [model, isConnected, isPlaying, detectObjects])

  const configureVideo = () => {
    if (!store) {
      return () => {}
    }

    // 비디오 엘리먼트 설정
    if (videoRef.current) {
      store.setVideoElement(videoRef.current)
    }

    // MediaStream 상태 확인
    const mediaStream = store.getMediaStream()

    if (mediaStream) {
      // MediaStream이 비디오 엘리먼트에 연결되었는지 확인
      if (videoRef.current && videoRef.current.srcObject === mediaStream) {
        // MediaStream이 연결되면 자동 재생 시도
        if (videoRef.current.paused) {
          videoRef.current.play().catch((error) => {
            console.error("❌ 비디오 자동 재생 실패:", error)
          })
        }
      }
    }

    // 비디오 이벤트 핸들러
    const videoElement = videoRef.current
    if (videoElement) {
      const handlePlay = () => {
        setIsPlaying(true)
      }
      const handlePause = () => {
        setIsPlaying(false)
      }
      const handleLoadedMetadata = () => {
        setError(null)
        setupCanvas()
      }
      const handleError = (e: any) => {
        console.error("비디오 로드 오류:", e)
        setError("비디오 로드 중 오류가 발생했습니다.")
      }

      videoElement.addEventListener("play", handlePlay)
      videoElement.addEventListener("pause", handlePause)
      videoElement.addEventListener("loadedmetadata", handleLoadedMetadata)
      videoElement.addEventListener("error", handleError)

      return () => {
        videoElement.removeEventListener("play", handlePlay)
        videoElement.removeEventListener("pause", handlePause)
        videoElement.removeEventListener("loadedmetadata", handleLoadedMetadata)
        videoElement.removeEventListener("error", handleError)
      }
    }

    return () => {
      // 비디오 엘리먼트가 변경되면 이전 이벤트 핸들러 제거
      if (videoRef.current) {
        videoRef.current.srcObject = null
      }
    }
  }

  useEffect(() => {
    if (!store) return

    const unsubscribe = store.subscribe((data) => {
      setVideoData(data)
      setIsConnected(data.isActive)
      setError(null)
      if (data.isActive) {
        configureVideo()
      }
    })

    const unscribeStreamStats = store.subscribeStreamStats((stats) => {
      setStreamStats(stats)
    })

    // 초기 데이터 설정
    if (store.getMediaStream()) {
      const initialData: VideoData = {
        streamId: store.getMediaStream()?.id || "",
        robotId: store.getRobotId(),
        channelLabel: store.getChannelLabel(),
        mediaStream: store.getMediaStream()!,
        isActive: store.isStreamActive(),
        timestamp: Date.now(),
      }
      setVideoData(initialData)
      setIsConnected(store.isStreamActive())
    }

    const closing = configureVideo()

    return () => {
      closing()
      unsubscribe()
      unscribeStreamStats()
    }
  }, [store, videoRef.current])

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
    }
  }

  if (!config || !config.stream_id) {
    return (
      <ErrorWidget
        robotId={robotId}
        config={config}
        onUpdateConfig={onUpdateConfig}
        openSetting={openSetting}
        setOpenSetting={setOpenSetting}
        onRemove={onRemove}
        message={"No stream ID configured"}
      />
    )
  }

  if (!store) {
    return (
      <ErrorWidget
        robotId={robotId}
        config={config}
        onUpdateConfig={onUpdateConfig}
        openSetting={openSetting}
        setOpenSetting={setOpenSetting}
        onRemove={onRemove}
        message={"No video stream available"}
      />
    )
  }

  // Footer info
  const footerInfo =
    videoData && streamStats
      ? [
          {
            label: "FPS",
            value: `${streamStats.fps} fps`,
          },
          {
            label: "Stream ID",
            value: videoData.streamId,
          },
          {
            label: "Model",
            value: config.tf_model,
          },
        ]
      : []

  const getStatusMessage = () => {
    if (isModelLoading) return "Loading AI model..."
    if (!isConnected) return "Waiting for stream..."
    if (isDetecting) return `Detecting objects... (${detections.length} found)`
    return "Video stream active"
  }

  return (
    <>
      <WidgetFrame
        title="Video Object Detection"
        robot_id={robotId}
        isConnected={isConnected}
        footerInfo={footerInfo}
        footerMessage={getStatusMessage()}
        onSettingClick={() => {
          setOpenSetting?.(true)
        }}
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
          <>
            <video
              ref={videoRef}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                borderRadius: "8px",
              }}
              playsInline
              muted
              autoPlay
            />

            {/* Object Detection Canvas Overlay */}
            <canvas
              ref={canvasRef}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                pointerEvents: "none",
                borderRadius: "8px",
              }}
            />

            {/* 비디오 컨트롤 오버레이 */}
            <Box
              position="absolute"
              bottom={0}
              left={0}
              right={0}
              bg="linear-gradient(to top, rgba(0,0,0,0.7), transparent)"
              p={3}
              opacity={0}
              _hover={{ opacity: 1 }}
              transition="opacity 0.2s"
            >
              <Flex justify="center" align="center" gap={2}>
                <IconButton
                  size="sm"
                  colorScheme="whiteAlpha"
                  onClick={handlePlayPause}
                  aria-label={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? "⏸️" : "▶️"}
                </IconButton>
              </Flex>
            </Box>

            {/* 모델 로딩 인디케이터 */}
            {isModelLoading && (
              <Flex
                position="absolute"
                top={0}
                left={0}
                right={0}
                bottom={0}
                bg="rgba(0, 0, 0, 0.5)"
                align="center"
                justify="center"
                color="white"
              >
                <Box textAlign="center">
                  <Box fontSize="2xl" mb={2}>
                    🤖
                  </Box>
                  <Box fontSize="sm">Loading AI model...</Box>
                </Box>
              </Flex>
            )}
          </>
        )}
      </WidgetFrame>
      {openSetting && (
        <VideoObjectDetectionSetting
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
