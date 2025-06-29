import React, { useEffect, useRef, useState, useCallback } from 'react'
import { Box, Text, VStack, HStack, Badge, Flex, IconButton, Icon } from '@chakra-ui/react'
import { VideoData, VideoStore } from '@/dashboard/store/media-channel-store/video-store'
import { ParsedTurtlesimVideo } from '../../../dashboard/parser/turtlesim-video'

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

    const now = performance.now()
    if (now - lastFrameTimeRef.current >= 1000) { // 1초마다 FPS 업데이트
      lastFrameTimeRef.current = now
    }

    animationFrameRef.current = requestAnimationFrame(measureFPSCallback)
  }, [store])

  useEffect(() => {
    if (!store) return

    const unsubscribe = store.subscribe((data) => {
      console.log('TurtlesimVideoWidget 구독자 콜백 호출됨:', data)
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

    // 비디오 엘리먼트 설정
    if (videoRef.current) {
      console.log('🎥 비디오 엘리먼트 설정:', videoRef.current)
      store.setVideoElement(videoRef.current)
      
      // 비디오 엘리먼트 상태 확인
      console.log('🎥 비디오 엘리먼트 초기 상태:', {
        srcObject: videoRef.current.srcObject,
        readyState: videoRef.current.readyState,
        networkState: videoRef.current.networkState,
        paused: videoRef.current.paused,
        currentTime: videoRef.current.currentTime,
        duration: videoRef.current.duration,
        videoWidth: videoRef.current.videoWidth,
        videoHeight: videoRef.current.videoHeight
      })
    } else {
      console.error('❌ 비디오 엘리먼트 ref가 null입니다')
    }

    // MediaStream 상태 확인
    const mediaStream = store.getMediaStream()
    console.log('🌊 현재 MediaStream 상태:', mediaStream)
    
    if (mediaStream) {
      console.log('🌊 MediaStream 정보:', {
        id: mediaStream.id,
        active: mediaStream.active,
        tracks: mediaStream.getTracks().map(track => ({
          kind: track.kind,
          label: track.label,
          enabled: track.enabled,
          readyState: track.readyState
        }))
      })
      
      // MediaStream이 비디오 엘리먼트에 연결되었는지 확인
      if (videoRef.current && videoRef.current.srcObject === mediaStream) {
        console.log('✅ MediaStream이 비디오 엘리먼트에 연결됨')
        
        // MediaStream이 연결되면 자동 재생 시도
        if (videoRef.current.paused) {
          console.log('▶️ 비디오 자동 재생 시도...')
          videoRef.current.play().then(() => {
            console.log('✅ 비디오 자동 재생 성공')
          }).catch((error) => {
            console.error('❌ 비디오 자동 재생 실패:', error)
          })
        }
      } else {
        console.log('❌ MediaStream이 비디오 엘리먼트에 연결되지 않음')
        console.log('🔍 연결 상태 비교:', {
          videoSrcObject: videoRef.current?.srcObject,
          mediaStream: mediaStream,
          isEqual: videoRef.current?.srcObject === mediaStream
        })
      }
    } else {
      console.log('⚠️ MediaStream이 아직 설정되지 않음')
    }

    // 비디오 이벤트 핸들러
    const videoElement = videoRef.current
    if (videoElement) {
      const handlePlay = () => {
        console.log('비디오 재생 시작')
        setIsPlaying(true)
      }
      const handlePause = () => {
        console.log('비디오 일시정지')
        setIsPlaying(false)
      }
      const handleLoadedMetadata = () => {
        console.log('비디오 메타데이터 로드됨:', {
          videoWidth: videoElement.videoWidth,
          videoHeight: videoElement.videoHeight,
          duration: videoElement.duration
        })
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
  }, [store, robotId, widgetId, measureFPSCallback])

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

  return (
    <VStack gap={3} align="stretch" h="100%">
      <Flex justify="space-between" align="center">
        <Text fontSize="sm" fontWeight="bold" color={isConnected ? 'green.500' : 'gray.500'}>
          Turtlesim Video
        </Text>
        <Badge colorScheme={isConnected ? 'green' : 'gray'} variant="subtle">
          {isConnected ? 'Connected' : 'Disconnected'}
        </Badge>
      </Flex>
      
      <Box 
        border="1px solid" 
        borderColor="gray.200" 
        borderRadius="lg" 
        p={3}
        bg="white"
        boxShadow="sm"
        flex="1"
        minH="250px"
        position="relative"
        overflow="hidden"
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
            <Text fontSize="2xl" mb={2}>⚠️</Text>
            <Text fontSize="sm">{error}</Text>
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
      </Box>
      
      {videoData && (
        <VStack gap={2} align="stretch">
          <HStack justify="space-between" fontSize="xs">
            <Text color="gray.600" fontWeight="medium">FPS</Text>
            <Text color="gray.800" fontFamily="mono">
              {videoData.stats.fps} fps
            </Text>
          </HStack>
          
          <HStack justify="space-between" fontSize="xs">
            <Text color="gray.600" fontWeight="medium">Resolution</Text>
            <Text color="gray.800" fontFamily="mono">
              {videoData.stats.width && videoData.stats.height 
                ? `${videoData.stats.width}x${videoData.stats.height}`
                : 'Unknown'
              }
            </Text>
          </HStack>

          <HStack justify="space-between" fontSize="xs">
            <Text color="gray.600" fontWeight="medium">Status</Text>
            <Badge 
              colorScheme={videoData.isActive ? 'green' : 'red'} 
              variant="subtle" 
              fontSize="xs"
            >
              {videoData.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </HStack>

          <HStack justify="space-between" fontSize="xs">
            <Text color="gray.600" fontWeight="medium">Stream ID</Text>
            <Text color="gray.800" fontFamily="mono" fontSize="xs">
              {videoData.streamId.slice(0, 8)}...
            </Text>
          </HStack>

          <Text fontSize="xs" color="gray.500" textAlign="center">
            {isConnected ? 'Video stream active' : 'Waiting for stream...'}
          </Text>
        </VStack>
      )}
    </VStack>
  )
} 