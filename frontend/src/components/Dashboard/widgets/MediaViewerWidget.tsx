import { WidgetFrame } from "@/components/Dashboard/WidgetFrame.tsx"
import type { WidgetProps } from "@/components/Dashboard/widgets/index.ts"
import { useMosaicStore } from "@/hooks/useMosaicStore.ts"
import type { MediaStreamStore } from "@/mosaic/store/interface/media-stream-store.ts"
import { Box, Flex, IconButton } from "@chakra-ui/react"
import { useEffect, useRef, useState } from "react"

export default function MediaViewerWidget({ widgetConfig }: WidgetProps) {
  const { getOrCreateStore, releaseStore } = useMosaicStore()
  const videoRef = useRef<HTMLVideoElement>(null)
  const connector = widgetConfig.connectors[0]
  const connectorRobotId = connector?.robotId ?? ""
  const connectorId = connector?.connectorId ?? ""
  const [isPlaying, setIsPlaying] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const configureVideo = (store: MediaStreamStore) => {
    // Set up video element
    if (videoRef.current) {
      store.setVideoElement(videoRef.current)
    }

    // Check MediaStream state
    const mediaStream = store.getMediaStream()

    if (mediaStream) {
      // Check if MediaStream is attached to the video element
      if (videoRef.current && videoRef.current.srcObject === mediaStream) {
        // Attempt autoplay once MediaStream is connected
        if (videoRef.current.paused) {
          videoRef.current.play().catch((error) => {
            console.error("❌ Video autoplay failed:", error)
          })
        }
      }
    }

    // Video event handlers
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
        console.error("Video load error:", e)
        setError("An error occurred while loading the video.")
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
  }

  useEffect(() => {
    if (!connector || !connectorRobotId || !connectorId) {
      return
    }

    const store = getOrCreateStore(connector) as MediaStreamStore
    if (store === null) {
      return
    }

    // Rebind immediately for already-connected sessions.
    configureVideo(store)

    store.onAfterConnected((_robotId: string) => {
      configureVideo(store)
    })
    // store.subscribe((data) => {
    //   setData(data)
    // })
    return () => {
      releaseStore(connector)
      if (videoRef.current) {
        videoRef.current.srcObject = null
      }
    }
  }, [connectorRobotId, connectorId])

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

  return (
    <WidgetFrame widgetConfig={widgetConfig}>
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

          {/* Overlay for video control */}
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
