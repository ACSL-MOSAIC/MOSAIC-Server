import { Box, Button, Flex, HStack, IconButton, Text } from "@chakra-ui/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { MediaStreamStore, StreamStats } from "@/stores/MediaStreamStore/MediaStreamStore.ts";
import type { WidgetProps } from "@/widgets/index.ts";

import { MosaicWidget } from "@/components/Dashboard/Widgets/WidgetComponents.tsx";
import { useMosaicStore } from "@/hooks/useMosaicStore.ts";
import { useRobotInfo } from "@/hooks/useRobotInfo.ts";

interface CollectedStat extends StreamStats {
  timestamp: number;
}

export default function MediaViewerWithStatWidget({ widgetConfig }: WidgetProps) {
  const { getOrCreateStore, releaseStore } = useMosaicStore();
  const { robotInfos } = useRobotInfo();
  const videoRef = useRef<HTMLVideoElement>(null);
  const connector = widgetConfig.connectors[0];
  const connectorRobotId = connector?.robotId ?? "";
  const connectorId = connector?.connectorId ?? "";
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statsList, setStatsList] = useState<CollectedStat[]>([]);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const storeRef = useRef<MediaStreamStore | null>(null);

  const robotName = useMemo(() => {
    const info = robotInfos.find((r) => r.id === connectorRobotId);
    return info?.name ?? connectorRobotId ?? "robot";
  }, [connectorRobotId, robotInfos]);

  const latestStat = statsList[statsList.length - 1] ?? null;

  const handleSave = useCallback(() => {
    const header = "seq,timestamp,fps,jitter,rtt_ms\n";
    const rows = statsList
      .map(
        (s, i) =>
          `${i + 1},${s.timestamp.toFixed(3)},${s.fps.toFixed(2)},${s.jitter.toFixed(6)},${s.rtt.toFixed(3)}`,
      )
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${robotName}_stream_stats.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [statsList, robotName]);

  const configureVideo = (store: MediaStreamStore) => {
    if (videoRef.current) {
      store.setVideoElement(videoRef.current);
    }

    const mediaStream = store.getMediaStream();
    if (mediaStream) {
      if (videoRef.current && videoRef.current.srcObject === mediaStream) {
        if (videoRef.current.paused) {
          videoRef.current.play().catch((error) => {
            console.error("❌ Video autoplay failed:", error);
          });
        }
      }
    }

    const videoElement = videoRef.current;
    if (videoElement) {
      const handlePlay = () => setIsPlaying(true);
      const handlePause = () => setIsPlaying(false);
      const handleLoadedMetadata = () => setError(null);
      const handleError = (e: any) => {
        console.error("Video load error:", e);
        setError("An error occurred while loading the video.");
      };

      videoElement.addEventListener("play", handlePlay);
      videoElement.addEventListener("pause", handlePause);
      videoElement.addEventListener("loadedmetadata", handleLoadedMetadata);
      videoElement.addEventListener("error", handleError);

      return () => {
        videoElement.removeEventListener("play", handlePlay);
        videoElement.removeEventListener("pause", handlePause);
        videoElement.removeEventListener("loadedmetadata", handleLoadedMetadata);
        videoElement.removeEventListener("error", handleError);
      };
    }
  };

  useEffect(() => {
    if (!connector || !connectorRobotId || !connectorId) {
      return;
    }

    const store = getOrCreateStore(connector) as MediaStreamStore;
    if (store === null) {
      return;
    }
    storeRef.current = store;

    configureVideo(store);
    store.onAfterConnected((_robotId: string) => {
      configureVideo(store);
    });

    intervalRef.current = setInterval(async () => {
      const stats = await storeRef.current?.getStats();
      if (stats) {
        const entry: CollectedStat = {
          ...stats,
          timestamp: performance.timeOrigin + performance.now(),
        };
        setStatsList((prev) => [...prev, entry]);
      }
    }, 500);

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      storeRef.current = null;
      releaseStore(connector);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [connectorRobotId, connectorId]);

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  const handleFullscreen = () => {
    if (videoRef.current) {
      if (!isFullscreen) {
        videoRef.current.requestFullscreen?.();
      } else {
        document.exitFullscreen?.();
      }
    }
  };

  const handleFullscreenChange = () => {
    setIsFullscreen(!!document.fullscreenElement);
  };

  useEffect(() => {
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  return (
    <MosaicWidget.Root widgetConfig={widgetConfig} error={error}>
      <MosaicWidget.Body>
        <Box display="flex" flexDirection="column" h="100%" w="100%">
          {/* Video area */}
          <Box flex={1} position="relative" minH={0}>
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

            {/* Overlay for video controls */}
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
          </Box>

          {/* Stats bar */}
          <HStack
            flexShrink={0}
            px={2}
            py={1}
            justify="space-between"
            fontSize="xs"
            fontFamily="mono"
            borderTop="1px solid"
            borderColor="gray.700"
          >
            <HStack gap={4}>
              <StatCell label="FPS" value={latestStat?.fps.toFixed(1) ?? "—"} />
              <StatCell
                label="Jitter"
                value={latestStat ? `${(latestStat.jitter * 1000).toFixed(3)} ms` : "—"}
              />
              <StatCell label="RTT" value={latestStat ? `${latestStat.rtt.toFixed(1)} ms` : "—"} />
            </HStack>
            <Button
              size="xs"
              variant="outline"
              colorPalette="teal"
              onClick={handleSave}
              disabled={statsList.length === 0}
            >
              Save CSV
            </Button>
          </HStack>
        </Box>
      </MosaicWidget.Body>
    </MosaicWidget.Root>
  );
}

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <HStack gap={1}>
      <Text color="gray.500">{label}:</Text>
      <Text color="cyan.500" fontWeight="semibold">
        {value}
      </Text>
    </HStack>
  );
}
