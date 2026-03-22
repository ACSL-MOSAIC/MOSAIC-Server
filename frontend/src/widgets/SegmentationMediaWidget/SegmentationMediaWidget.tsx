import { Box, Flex, Text } from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";

import type { MediaStreamStore } from "@/stores/MediaStreamStore/MediaStreamStore.ts";
import type { WidgetProps } from "@/widgets/index.ts";

import { MosaicWidget } from "@/components/Dashboard/Widgets/WidgetComponents.tsx";
import { useMosaicStore } from "@/hooks/useMosaicStore.ts";

export default function SegmentationMediaWidget({ widgetConfig }: WidgetProps) {
  const { getOrCreateStore, releaseStore } = useMosaicStore();
  const videoRef = useRef<HTMLVideoElement>(null);
  const connector = widgetConfig.connectors[0];
  const connectorRobotId = connector?.robotId ?? "";
  const connectorId = connector?.connectorId ?? "";
  const [error, setError] = useState<string | null>(null);

  const configureVideo = (store: MediaStreamStore) => {
    if (videoRef.current) {
      store.setVideoElement(videoRef.current);
    }

    const mediaStream = store.getMediaStream();
    if (mediaStream && videoRef.current && videoRef.current.srcObject === mediaStream) {
      if (videoRef.current.paused) {
        videoRef.current.play().catch((playError) => {
          console.error("SegmentationMediaWidget autoplay failed:", playError);
        });
      }
    }

    const videoElement = videoRef.current;
    if (!videoElement) {
      return;
    }

    const handleLoadedMetadata = () => setError(null);
    const handleError = (event: Event) => {
      console.error("SegmentationMediaWidget video load error:", event);
      setError("Failed to load media stream.");
    };

    videoElement.addEventListener("loadedmetadata", handleLoadedMetadata);
    videoElement.addEventListener("error", handleError);

    return () => {
      videoElement.removeEventListener("loadedmetadata", handleLoadedMetadata);
      videoElement.removeEventListener("error", handleError);
    };
  };

  useEffect(() => {
    if (!connector || !connectorRobotId || !connectorId) {
      return;
    }

    const store = getOrCreateStore(connector) as MediaStreamStore;
    if (store === null) {
      return;
    }

    let cleanupVideoListeners = configureVideo(store);
    const unsubscribeAfterConnected = store.onAfterConnected(() => {
      cleanupVideoListeners?.();
      cleanupVideoListeners = configureVideo(store);
    });

    return () => {
      cleanupVideoListeners?.();
      unsubscribeAfterConnected();
      releaseStore(connector);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [connector, connectorRobotId, connectorId, getOrCreateStore, releaseStore]);

  return (
    <MosaicWidget.Root widgetConfig={widgetConfig}>
      <MosaicWidget.Header additionalInfo={[{ label: "Model", value: "deeplab" }]} />
      <MosaicWidget.Body>
        {error ? (
          <Flex
            direction="column"
            align="center"
            justify="center"
            color="red.500"
            textAlign="center"
          >
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
            <Box
              position="absolute"
              top={2}
              left={2}
              bg="blackAlpha.600"
              px={2}
              py={1}
              borderRadius="md"
            >
              <Text color="white" fontSize="xs">
                Segmentation overlay scaffold (deeplab)
              </Text>
            </Box>
          </>
        )}
      </MosaicWidget.Body>
    </MosaicWidget.Root>
  );
}
