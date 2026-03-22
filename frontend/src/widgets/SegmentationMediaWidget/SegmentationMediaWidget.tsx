import { Box, Flex, Text } from "@chakra-ui/react";
import * as deepLab from "@tensorflow-models/deeplab";
import * as tf from "@tensorflow/tfjs";
import { useCallback, useEffect, useRef, useState } from "react";

import type { MediaStreamStore } from "@/stores/MediaStreamStore/MediaStreamStore.ts";
import type { WidgetProps } from "@/widgets/index.ts";

import { MosaicWidget } from "@/components/Dashboard/Widgets/WidgetComponents.tsx";
import { useMosaicStore } from "@/hooks/useMosaicStore.ts";

const SEGMENTATION_INTERVAL_MS = 100;
const DEEPLAB_MODEL_BASE = "pascal";

interface SegmentationOutput {
  width: number;
  height: number;
  segmentationMap: Uint8Array | Uint8ClampedArray | number[];
}

export default function SegmentationMediaWidget({ widgetConfig }: WidgetProps) {
  const { getOrCreateStore, releaseStore } = useMosaicStore();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const modelRef = useRef<deepLab.SemanticSegmentation | null>(null);
  const tempCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const isSegmentingRef = useRef(false);
  const connector = widgetConfig.connectors[0];
  const connectorRobotId = connector?.robotId ?? "";
  const connectorId = connector?.connectorId ?? "";
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [isModelReady, setIsModelReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isStreamReady, setIsStreamReady] = useState(false);
  const [isSegmenting, setIsSegmenting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearOverlay = useCallback(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  }, []);

  const stopSegmentationLoop = useCallback(() => {
    isSegmentingRef.current = false;
    setIsSegmenting(false);
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    clearOverlay();
  }, [clearOverlay]);

  const setupCanvas = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.videoWidth === 0 || video.videoHeight === 0) {
      return;
    }

    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;
    const elementWidth = video.clientWidth;
    const elementHeight = video.clientHeight;

    if (elementWidth === 0 || elementHeight === 0) {
      return;
    }

    const videoAspectRatio = videoWidth / videoHeight;
    const elementAspectRatio = elementWidth / elementHeight;

    let displayWidth = 0;
    let displayHeight = 0;
    let offsetX = 0;
    let offsetY = 0;

    if (videoAspectRatio > elementAspectRatio) {
      displayWidth = elementWidth;
      displayHeight = elementWidth / videoAspectRatio;
      offsetY = (elementHeight - displayHeight) / 2;
    } else {
      displayWidth = elementHeight * videoAspectRatio;
      displayHeight = elementHeight;
      offsetX = (elementWidth - displayWidth) / 2;
    }

    canvas.width = videoWidth;
    canvas.height = videoHeight;
    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayHeight}px`;
    canvas.style.left = `${offsetX}px`;
    canvas.style.top = `${offsetY}px`;
  }, []);

  const drawSegmentation = useCallback((output: SegmentationOutput) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const canvasCtx = canvas.getContext("2d");
    if (!canvasCtx) {
      return;
    }

    if (!tempCanvasRef.current) {
      tempCanvasRef.current = document.createElement("canvas");
    }
    const tempCanvas = tempCanvasRef.current;
    const tempCtx = tempCanvas.getContext("2d");
    if (!tempCtx) {
      return;
    }

    const { width, height, segmentationMap } = output;
    tempCanvas.width = width;
    tempCanvas.height = height;
    const imageData = tempCtx.createImageData(width, height);
    const data = imageData.data;

    for (let i = 0; i < segmentationMap.length; i += 4) {
      const r = segmentationMap[i] ?? 0;
      const g = segmentationMap[i + 1] ?? 0;
      const b = segmentationMap[i + 2] ?? 0;

      if (r !== 0 || g !== 0 || b !== 0) {
        data[i] = r;
        data[i + 1] = g;
        data[i + 2] = b;
        data[i + 3] = 130;
      } else {
        data[i] = 0;
        data[i + 1] = 0;
        data[i + 2] = 0;
        data[i + 3] = 0;
      }
    }

    tempCtx.putImageData(imageData, 0, 0);
    canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
    canvasCtx.drawImage(tempCanvas, 0, 0, width, height, 0, 0, canvas.width, canvas.height);
  }, []);

  const runSegmentation = useCallback(async () => {
    if (!isSegmentingRef.current) {
      return;
    }

    const video = videoRef.current;
    const model = modelRef.current;
    if (!video || !model || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      timerRef.current = window.setTimeout(() => {
        animationFrameRef.current = window.requestAnimationFrame(() => {
          void runSegmentation();
        });
      }, SEGMENTATION_INTERVAL_MS);
      return;
    }

    setupCanvas();
    try {
      const output = (await model.segment(video)) as SegmentationOutput;
      if (!isSegmentingRef.current) {
        return;
      }
      drawSegmentation(output);
    } catch (segmentError) {
      console.error("Segmentation inference failed:", segmentError);
    }

    if (!isSegmentingRef.current) {
      return;
    }

    timerRef.current = window.setTimeout(() => {
      animationFrameRef.current = window.requestAnimationFrame(() => {
        void runSegmentation();
      });
    }, SEGMENTATION_INTERVAL_MS);
  }, [drawSegmentation, setupCanvas]);

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

    const syncVideoState = () => {
      const hasMetadata = videoElement.readyState >= HTMLMediaElement.HAVE_METADATA;
      setIsStreamReady(hasMetadata);
      setIsPlaying(!videoElement.paused && !videoElement.ended);
      if (hasMetadata) {
        setError(null);
        setupCanvas();
      }
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleLoadedMetadata = () => {
      setError(null);
      setIsStreamReady(true);
      setupCanvas();
    };
    const handleLoadedData = () => {
      setIsStreamReady(true);
      setupCanvas();
    };
    const handleEmptied = () => {
      setIsStreamReady(false);
      setIsPlaying(false);
      clearOverlay();
    };
    const handleEnded = () => setIsPlaying(false);
    const handleStalled = () => setIsPlaying(false);
    const handleError = (event: Event) => {
      console.error("SegmentationMediaWidget video load error:", event);
      setError("Failed to load media stream.");
      setIsStreamReady(false);
      setIsPlaying(false);
    };

    videoElement.addEventListener("play", handlePlay);
    videoElement.addEventListener("pause", handlePause);
    videoElement.addEventListener("loadedmetadata", handleLoadedMetadata);
    videoElement.addEventListener("loadeddata", handleLoadedData);
    videoElement.addEventListener("emptied", handleEmptied);
    videoElement.addEventListener("ended", handleEnded);
    videoElement.addEventListener("stalled", handleStalled);
    videoElement.addEventListener("error", handleError);
    syncVideoState();

    return () => {
      videoElement.removeEventListener("play", handlePlay);
      videoElement.removeEventListener("pause", handlePause);
      videoElement.removeEventListener("loadedmetadata", handleLoadedMetadata);
      videoElement.removeEventListener("loadeddata", handleLoadedData);
      videoElement.removeEventListener("emptied", handleEmptied);
      videoElement.removeEventListener("ended", handleEnded);
      videoElement.removeEventListener("stalled", handleStalled);
      videoElement.removeEventListener("error", handleError);
    };
  };

  useEffect(() => {
    let cancelled = false;

    const loadModel = async () => {
      setIsModelLoading(true);
      setIsModelReady(false);

      try {
        await tf.ready();
        const loadedModel = await deepLab.load({
          base: DEEPLAB_MODEL_BASE,
          quantizationBytes: 2,
        });

        if (cancelled) {
          const disposableModel = loadedModel as { dispose?: () => void };
          disposableModel.dispose?.();
          return;
        }

        modelRef.current = loadedModel;
        setIsModelReady(true);
      } catch (modelError) {
        console.error("DeepLab load failed:", modelError);
        if (!cancelled) {
          setError("Failed to load deeplab model.");
        }
      } finally {
        if (!cancelled) {
          setIsModelLoading(false);
        }
      }
    };

    void loadModel();

    return () => {
      cancelled = true;
      stopSegmentationLoop();
      const disposableModel = modelRef.current as { dispose?: () => void } | null;
      disposableModel?.dispose?.();
      modelRef.current = null;
      tempCanvasRef.current = null;
    };
  }, [stopSegmentationLoop]);

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
      stopSegmentationLoop();
      setIsStreamReady(false);
      setIsPlaying(false);
      releaseStore(connector);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [connectorRobotId, connectorId, stopSegmentationLoop]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const handleViewportChange = () => setupCanvas();
    const resizeObserver = new ResizeObserver(handleViewportChange);
    resizeObserver.observe(video);
    window.addEventListener("resize", handleViewportChange);
    document.addEventListener("fullscreenchange", handleViewportChange);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", handleViewportChange);
      document.removeEventListener("fullscreenchange", handleViewportChange);
    };
  }, [setupCanvas]);

  useEffect(() => {
    if (!isModelReady || !isStreamReady || !isPlaying || error) {
      stopSegmentationLoop();
      return;
    }

    if (isSegmentingRef.current) {
      return;
    }

    isSegmentingRef.current = true;
    setIsSegmenting(true);
    void runSegmentation();

    return () => {
      stopSegmentationLoop();
    };
  }, [error, isModelReady, isPlaying, isStreamReady, runSegmentation, stopSegmentationLoop]);

  return (
    <MosaicWidget.Root widgetConfig={widgetConfig}>
      <MosaicWidget.Header
        additionalInfo={[
          { label: "Model", value: "deeplab" },
          {
            label: "Status",
            value: isModelLoading ? "Loading model..." : isSegmenting ? "Running" : "Idle",
          },
        ]}
      />
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
          <Box position="relative" w="100%" h="100%">
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
            <canvas
              ref={canvasRef}
              style={{
                position: "absolute",
                pointerEvents: "none",
                borderRadius: "8px",
              }}
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
                {isModelLoading ? "Loading deeplab..." : "Segmentation overlay (deeplab)"}
              </Text>
            </Box>
          </Box>
        )}
      </MosaicWidget.Body>
    </MosaicWidget.Root>
  );
}
