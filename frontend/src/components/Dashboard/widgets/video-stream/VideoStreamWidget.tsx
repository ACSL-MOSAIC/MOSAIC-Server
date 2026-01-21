import {
  type StreamStats,
  type VideoData,
  type VideoStore,
  getInitialStreamStats,
  getInitialVideoData,
} from "@/dashboard/store/media-channel-store/video-store"
import {Box, Flex, IconButton} from "@chakra-ui/react"
import type React from "react"
import {useEffect, useRef, useState} from "react"
import {WidgetFrame} from "../WidgetFrame"

interface VideoStreamWidgetProps {
  robotId: string
  store: VideoStore
  dataType: string
  onRemove?: () => void
}

export const VideoStreamWidget: React.FC<VideoStreamWidgetProps> = ({
                                                                      robotId,
                                                                      store,
                                                                      onRemove,
                                                                    }) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [videoData, setVideoData] = useState<VideoData | null>(
    getInitialVideoData(),
  )
  const [streamStats, setStreamStats] = useState<StreamStats>(
    getInitialStreamStats(),
  )
  const [isPlaying, setIsPlaying] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  const configureVideo = () => {
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

  const handleFullscreen = () => {
    if (videoRef.current) {
      if (!isFullscreen) {
        if (videoRef.current.requestFullscreen) {
          videoRef.current.requestFullscreen()
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen()
        }
      }
    }
  }

  const handleFullscreenChange = () => {
    setIsFullscreen(!!document.fullscreenElement)
  }

  useEffect(() => {
    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange)
    }
  }, [])

  // Footer info
  const footerInfo =
    videoData && streamStats
      ? [
        {
          label: "Status",
          value: `FPS: ${streamStats.fps} fps, Jitter: ${streamStats.jitter} ms, RTT: ${streamStats.rtt.toFixed(1)} ms`,
        },
        {
          label: "Resolution",
          value:
            streamStats.width && streamStats.height
              ? `${streamStats.width}x${streamStats.height}`
              : "Unknown",
        },
        {
          label: "Stream ID",
          value: videoData.streamId,
        },
      ]
      : []

  return (
    <WidgetFrame
      title="Video Stream"
      robot_id={robotId}
      isConnected={isConnected}
      footerInfo={footerInfo}
      footerMessage={
        isConnected ? "Video stream active" : "Waiting for stream..."
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

          {/* 비디오 컨트롤 오버레이 */}
          <Box
            position="absolute"
            bottom={0}
            left={0}
            right={0}
            bg="linear-gradient(to top, rgba(0,0,0,0.7), transparent)"
            p={3}
            opacity={0}
            _hover={{opacity: 1}}
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

              <IconButton
                size="sm"
                colorScheme="whiteAlpha"
                onClick={handleFullscreen}
                aria-label="Fullscreen"
              >
                ⛶
              </IconButton>
            </Flex>
          </Box>
        </>
      )}
    </WidgetFrame>
  )
}
