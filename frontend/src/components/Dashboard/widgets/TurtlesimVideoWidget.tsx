import React, { useEffect, useRef, useState, useCallback } from 'react'
import { Box, Flex, IconButton } from '@chakra-ui/react'
import { VideoData, VideoStore } from '@/dashboard/store/media-channel-store/video-store'
import { ParsedTurtlesimVideo } from '../../../dashboard/parser/turtlesim-video'
import { WidgetFrame } from './WidgetFrame'

interface TurtlesimVideoWidgetProps {
  robotId: string
  widgetId: string
  store: VideoStore
  dataType: string
}

export const TurtlesimVideoWidget: React.FC<TurtlesimVideoWidgetProps> = ({
  robotId,
  widgetId,
  store,
  dataType
}) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [videoData, setVideoData] = useState<VideoData | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [measureFPS, setMeasureFPS] = useState(false)
  const animationFrameRef = useRef<number | null>(null)
  const lastFrameTimeRef = useRef<number>(0)

  // FPS 측정을 위한 requestAnimationFrame (컴포넌트 최상위 레벨로 이동)
  const measureFPSCallback = useCallback(() => {
    if (!videoRef.current || videoRef.current.paused || !store) {
      animationFrameRef.current = requestAnimationFrame(measureFPSCallback)
      return
    }

    // 비디오 프레임이 렌더링될 때 FPS 카운터 증가
    store.incrementFpsCounter()

    animationFrameRef.current = requestAnimationFrame(measureFPSCallback)
  }, [store])

  // 비디오 프레임 콜백 (더 정확한 FPS 측정)
  const videoFrameCallback = useCallback(() => {
    if (!videoRef.current || !store) return

    // 비디오 프레임이 실제로 렌더링될 때 FPS 카운터 증가
    store.incrementFpsCounter()

    // 다음 비디오 프레임 요청
    if (videoRef.current.requestVideoFrameCallback) {
      videoRef.current.requestVideoFrameCallback(videoFrameCallback)
    }
  }, [store])

  useEffect(() => {
    if (!store) return

    const unsubscribe = store.subscribe((data) => {
      setVideoData(data)
      setIsConnected(data.isActive)
      setError(null)
    })

    // 초기 데이터 설정
    if (store.getMediaStream()) {
      const initialData: VideoData = {
        streamId: store.getMediaStream()?.id || '',
        robotId: store.getRobotId(),
        channelLabel: store.getChannelLabel(),
        mediaStream: store.getMediaStream()!,
        isActive: store.isStreamActive(),
        stats: store.getStreamStats(),
        timestamp: Date.now()
      }
      setVideoData(initialData)
      setIsConnected(store.isStreamActive())
    }

    // FPS 측정 시작
    animationFrameRef.current = requestAnimationFrame(measureFPSCallback)

    // 비디오 프레임 콜백 시작 (더 정확한 FPS 측정)
    if (videoRef.current && videoRef.current.requestVideoFrameCallback) {
      videoRef.current.requestVideoFrameCallback(videoFrameCallback)
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
            console.error('❌ 비디오 자동 재생 실패:', error)
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
        console.error('비디오 로드 오류:', e)
        setError('비디오 로드 중 오류가 발생했습니다.')
      }

      videoElement.addEventListener('play', handlePlay)
      videoElement.addEventListener('pause', handlePause)
      videoElement.addEventListener('loadedmetadata', handleLoadedMetadata)
      videoElement.addEventListener('error', handleError)

      return () => {
        videoElement.removeEventListener('play', handlePlay)
        videoElement.removeEventListener('pause', handlePause)
        videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata)
        videoElement.removeEventListener('error', handleError)
        
        // FPS 측정 정리
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current)
        }
        
        unsubscribe()
      }
    }

    return () => {
      // FPS 측정 정리
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      unsubscribe()
    }
  }, [store, robotId, widgetId, measureFPSCallback, videoFrameCallback])

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
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [])

  // Footer info
  const footerInfo = videoData ? [
    {
      label: 'FPS',
      value: `${videoData.stats.fps} fps`
    },
    {
      label: 'Resolution',
      value: videoData.stats.width && videoData.stats.height 
        ? `${videoData.stats.width}x${videoData.stats.height}`
        : 'Unknown'
    },
    {
      label: 'Status',
      value: videoData.isActive ? 'Active' : 'Inactive'
    },
    {
      label: 'Stream ID',
      value: `${videoData.streamId.slice(0, 8)}...`
    }
  ] : []

  return (
    <WidgetFrame
      title="Turtlesim Video"
      isConnected={isConnected}
      footerInfo={footerInfo}
      footerMessage={isConnected ? 'Video stream active' : 'Waiting for stream...'}
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
          <Box fontSize="2xl" mb={2}>⚠️</Box>
          <Box fontSize="sm">{error}</Box>
        </Flex>
      ) : (
        <>
          <video
            ref={videoRef}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              borderRadius: '8px'
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
            _hover={{ opacity: 1 }}
            transition="opacity 0.2s"
          >
            <Flex justify="center" align="center" gap={2}>
              <IconButton
                size="sm"
                colorScheme="whiteAlpha"
                onClick={handlePlayPause}
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? '⏸️' : '▶️'}
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