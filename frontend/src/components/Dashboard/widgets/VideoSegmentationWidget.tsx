import {
  type StreamStats,
  type VideoData,
  getInitialStreamStats,
  getInitialVideoData,
} from "@/dashboard/store/media-channel-store/video-store"
import { VideoStoreManager } from "@/dashboard/store/media-channel-store/video-store-manager.ts"
import { Box, Flex, IconButton } from "@chakra-ui/react"
import * as deepLab from "@tensorflow-models/deeplab"
import type { DeepLabOutput } from "@tensorflow-models/deeplab/dist/types"
import * as tf from "@tensorflow/tfjs"
import type React from "react"
import { useCallback } from "react"
import { useEffect, useRef, useState } from "react"
import { VideoSegmentationSetting } from "./VideoSegmentationSetting"
import { WidgetFrame } from "./WidgetFrame"

const deeplabModelBase = "pascal"

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
      title="Video Segmentation"
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
      <VideoSegmentationSetting
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

export const VideoSegmentationWidget: React.FC<
  VideoSegmentationWidgetProps
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

  // Segmentation 관련 상태
  const [model, setModel] = useState<deepLab.SemanticSegmentation | null>(null)
  const [isModelLoading, setIsModelLoading] = useState(true)
  const [isSegmenting, setIsSegmenting] = useState(false)
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

        // DeepLab v3 모델 로드
        const loadedModel = await deepLab.load({
          base: deeplabModelBase,
          quantizationBytes: 2,
        })
        setModel(loadedModel)
        setIsModelLoading(false)
        console.log("✅ DeepLab model loaded successfully")
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

      // video의 실제 비디오 크기
      const videoWidth = video.videoWidth
      const videoHeight = video.videoHeight

      // video element의 display 크기
      const elementWidth = video.offsetWidth
      const elementHeight = video.offsetHeight

      // object-fit: contain으로 인한 실제 표시 영역 계산
      const videoAspectRatio = videoWidth / videoHeight
      const elementAspectRatio = elementWidth / elementHeight

      let displayWidth: number
      let displayHeight: number
      let offsetX: number
      let offsetY: number

      if (videoAspectRatio > elementAspectRatio) {
        // 비디오가 더 넓음 - 가로가 꽉 참
        displayWidth = elementWidth
        displayHeight = elementWidth / videoAspectRatio
        offsetX = 0
        offsetY = (elementHeight - displayHeight) / 2
      } else {
        // 비디오가 더 높음 - 세로가 꽉 참
        displayWidth = elementHeight * videoAspectRatio
        displayHeight = elementHeight
        offsetX = (elementWidth - displayWidth) / 2
        offsetY = 0
      }

      // 캔버스 크기를 실제 비디오 해상도로 설정
      canvas.width = videoWidth
      canvas.height = videoHeight

      // 캔버스 스타일을 실제 표시 영역에 맞게 설정
      canvas.style.width = `${displayWidth}px`
      canvas.style.height = `${displayHeight}px`
      canvas.style.position = "absolute"
      canvas.style.top = `${offsetY + 12}px`
      canvas.style.left = `${offsetX + 12}px`
    }
  }, [])

  const nextFrame = () => {
    animationFrameRef.current = requestAnimationFrame(() => {
      setTimeout(segmentObjects, 100)
    })
  }

  const segmentObjects = useCallback(async () => {
    if (!isSegmenting || !model || !videoRef.current || !canvasRef.current) {
      nextFrame()
      return
    }

    try {
      const video = videoRef.current
      const canvas = canvasRef.current
      const tempCanvas = document.createElement("canvas")
      const canvasCtx = canvas.getContext("2d")
      const tempCanvasCtx = tempCanvas.getContext("2d")

      if (!canvasCtx || !tempCanvasCtx || video.readyState !== 4) {
        nextFrame()
        return
      }

      const segmentations = await model.segment(video)

      canvasCtx.clearRect(0, 0, canvas.width, canvas.height)
      setupCanvas()

      drawSegmentations(
        canvas,
        canvasCtx,
        tempCanvas,
        tempCanvasCtx,
        segmentations,
      )
    } catch (err) {
      console.error("Detection error:", err)
    }

    // 다음 프레임 스케줄링 (10FPS)
    if (isSegmenting && isPlaying) {
      nextFrame()
    }
  }, [isSegmenting, isPlaying, model])

  // 탐지 결과 그리기
  const drawSegmentations = (
    canvas: HTMLCanvasElement,
    canvasCtx: CanvasRenderingContext2D,
    tempCanvas: HTMLCanvasElement,
    tempCanvasCtx: CanvasRenderingContext2D,
    { width, height, segmentationMap }: DeepLabOutput,
  ) => {
    tempCanvas.width = width
    tempCanvas.height = height

    const imageData = tempCanvasCtx.createImageData(width, height)
    const data = imageData.data

    // RGBA 형태의 segmentationMap을 4씩 건너뛰며 처리
    for (let i = 0; i < segmentationMap.length; i += 4) {
      const r = segmentationMap[i] // Red
      const g = segmentationMap[i + 1] // Green
      const b = segmentationMap[i + 2] // Blue
      // const a = segmentationMap[i + 3] // Alpha

      const pixelIndex = i // 이미 4배수이므로 그대로 사용

      // 배경이 아닌 경우 (검은색이 아닌 경우)
      if (r !== 0 || g !== 0 || b !== 0) {
        data[pixelIndex] = r
        data[pixelIndex + 1] = g
        data[pixelIndex + 2] = b
        data[pixelIndex + 3] = 130 // 반투명
      } else {
        // 배경은 투명하게
        data[pixelIndex] = 0
        data[pixelIndex + 1] = 0
        data[pixelIndex + 2] = 0
        data[pixelIndex + 3] = 0
      }
    }

    // 임시 캔버스에 그리기
    tempCanvasCtx.putImageData(imageData, 0, 0)

    // 비디오 캔버스 크기에 맞게 스케일링해서 그리기
    canvasCtx.drawImage(
      tempCanvas,
      0,
      0,
      width,
      height,
      0,
      0,
      canvas.width,
      canvas.height,
    )
  }

  // 탐지 자동 시작
  useEffect(() => {
    if (model && isConnected) {
      setIsSegmenting(true)
      // segmentObjects 호출을 다음 렌더링 사이클로 지연
      const timer = setTimeout(segmentObjects, 0)
      return () => clearTimeout(timer)
    }
    setIsSegmenting(false)
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    // 캔버스 클리어
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d")
      ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
    }
  }, [model, isConnected, segmentObjects])

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
    if (isSegmenting) return "Segmenting objects..."
    return "Video stream active"
  }

  return (
    <>
      <WidgetFrame
        title="Video Segmentation"
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

            {/* Segmentation Canvas Overlay */}
            <canvas
              ref={canvasRef}
              style={{
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
        <VideoSegmentationSetting
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
