import * as cocoSsd from "@tensorflow-models/coco-ssd";
import * as tf from "@tensorflow/tfjs";
import { useCallback, useEffect, useRef, useState } from "react";

import type { MediaStreamStore } from "@/stores/MediaStreamStore/MediaStreamStore.ts";
import type { WidgetProps } from "@/widgets/index.ts";

import { MosaicWidget } from "@/components/Dashboard/Widgets/WidgetComponents.tsx";
import { useMosaicStore } from "@/hooks/useMosaicStore.ts";
import { ObjectDetectionMediaSetting } from "@/widgets/ObjectDetectionMediaWidget/ObjectDetectionMediaSetting.tsx";

const DEFAULT_DETECTION_HZ = 10;
const DEFAULT_SCORE_THRESHOLD = 0.5;
const MIN_DETECTION_HZ = 1;
const MAX_DETECTION_HZ = 60;
const MIN_SCORE_THRESHOLD = 0;
const MAX_SCORE_THRESHOLD = 1;

interface Detection {
  class: string;
  score: number;
  bbox: [number, number, number, number];
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const sanitizeDetectionHz = (value: unknown): number => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return DEFAULT_DETECTION_HZ;
  }
  return clamp(value, MIN_DETECTION_HZ, MAX_DETECTION_HZ);
};

const sanitizeScoreThreshold = (value: unknown): number => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return DEFAULT_SCORE_THRESHOLD;
  }
  return clamp(value, MIN_SCORE_THRESHOLD, MAX_SCORE_THRESHOLD);
};

const sanitizeBoolean = (value: unknown): boolean => value === true;

export default function ObjectDetectionMediaWidget({ widgetConfig }: WidgetProps) {
  const { getOrCreateStore, releaseStore } = useMosaicStore();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const modelRef = useRef<cocoSsd.ObjectDetection | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const isDetectingRef = useRef(false);
  const connector = widgetConfig.connectors[0];
  const connectorRobotId = connector?.robotId ?? "";
  const connectorId = connector?.connectorId ?? "";
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [isModelReady, setIsModelReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isStreamReady, setIsStreamReady] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [detectionHz, setDetectionHz] = useState<number>(
    sanitizeDetectionHz(widgetConfig.params?.detectionHz),
  );
  const [scoreThreshold, setScoreThreshold] = useState<number>(
    sanitizeScoreThreshold(widgetConfig.params?.scoreThreshold),
  );
  const [flipH, setFlipH] = useState<boolean>(sanitizeBoolean(widgetConfig.params?.flipH));
  const [flipV, setFlipV] = useState<boolean>(sanitizeBoolean(widgetConfig.params?.flipV));
  const detectionIntervalMs = Math.round(1000 / detectionHz);

  useEffect(() => {
    setDetectionHz(sanitizeDetectionHz(widgetConfig.params?.detectionHz));
    setScoreThreshold(sanitizeScoreThreshold(widgetConfig.params?.scoreThreshold));
    setFlipH(sanitizeBoolean(widgetConfig.params?.flipH));
    setFlipV(sanitizeBoolean(widgetConfig.params?.flipV));
  }, [
    widgetConfig.params?.detectionHz,
    widgetConfig.params?.scoreThreshold,
    widgetConfig.params?.flipH,
    widgetConfig.params?.flipV,
  ]);

  const clearOverlay = useCallback(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  }, []);

  const stopDetectionLoop = useCallback(() => {
    isDetectingRef.current = false;
    setIsDetecting(false);
    setDetections([]);
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

  const drawDetections = useCallback((items: Detection[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#00ff00";
    ctx.lineWidth = 3;
    ctx.font = "20px Arial";

    for (const detection of items) {
      const [x, y, width, height] = detection.bbox;
      ctx.strokeRect(x, y, width, height);

      const label = `${detection.class} ${(detection.score * 100).toFixed(1)}%`;
      const textWidth = ctx.measureText(label).width;
      const padding = 4;
      const textHeight = 20;
      const labelY = Math.max(y - (textHeight + padding * 2), 0);

      ctx.fillStyle = "rgba(0, 255, 0, 0.85)";
      ctx.fillRect(x, labelY, textWidth + padding * 2, textHeight + padding * 2);

      ctx.fillStyle = "#000";
      ctx.fillText(label, x + padding, labelY + textHeight);
    }
  }, []);

  const runDetection = useCallback(async () => {
    if (!isDetectingRef.current) {
      return;
    }

    const video = videoRef.current;
    const model = modelRef.current;
    if (!video || !model || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      timerRef.current = window.setTimeout(() => {
        animationFrameRef.current = window.requestAnimationFrame(() => {
          void runDetection();
        });
      }, detectionIntervalMs);
      return;
    }

    setupCanvas();

    try {
      const predictions = await model.detect(video);
      if (!isDetectingRef.current) {
        return;
      }

      const filteredDetections: Detection[] = predictions
        .filter((prediction) => prediction.score > scoreThreshold)
        .map((prediction) => ({
          class: prediction.class,
          score: prediction.score,
          bbox: prediction.bbox,
        }));

      setDetections(filteredDetections);
      drawDetections(filteredDetections);
    } catch (detectionError) {
      console.error("Object detection inference failed:", detectionError);
    }

    if (!isDetectingRef.current) {
      return;
    }

    timerRef.current = window.setTimeout(() => {
      animationFrameRef.current = window.requestAnimationFrame(() => {
        void runDetection();
      });
    }, detectionIntervalMs);
  }, [detectionIntervalMs, drawDetections, scoreThreshold, setupCanvas]);

  const configureVideo = (store: MediaStreamStore) => {
    if (videoRef.current) {
      store.setVideoElement(videoRef.current);
    }

    const mediaStream = store.getMediaStream();
    if (mediaStream && videoRef.current && videoRef.current.srcObject === mediaStream) {
      if (videoRef.current.paused) {
        videoRef.current.play().catch((playError) => {
          console.error("ObjectDetectionMediaWidget autoplay failed:", playError);
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
      console.error("ObjectDetectionMediaWidget video load error:", event);
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
        const loadedModel = await cocoSsd.load();

        if (cancelled) {
          return;
        }

        modelRef.current = loadedModel;
        setIsModelReady(true);
      } catch (modelError) {
        console.error("COCO-SSD load failed:", modelError);
        if (!cancelled) {
          setError("Failed to load coco-ssd model.");
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
      stopDetectionLoop();
      modelRef.current = null;
    };
  }, [stopDetectionLoop]);

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
      stopDetectionLoop();
      setIsStreamReady(false);
      setIsPlaying(false);
      releaseStore(connector);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [connectorRobotId, connectorId, stopDetectionLoop]);

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
      stopDetectionLoop();
      return;
    }

    if (isDetectingRef.current) {
      return;
    }

    isDetectingRef.current = true;
    setIsDetecting(true);
    void runDetection();

    return () => {
      stopDetectionLoop();
    };
  }, [error, isModelReady, isPlaying, isStreamReady, runDetection, stopDetectionLoop]);

  return (
    <MosaicWidget.Root widgetConfig={widgetConfig} error={error}>
      <MosaicWidget.Header
        additionalInfo={[
          { label: "Model", value: "coco-ssd" },
          { label: "Detections", value: String(detections.length) },
          { label: "Frequency", value: `${detectionHz}Hz` },
          { label: "Threshold", value: scoreThreshold.toFixed(2) },
          {
            label: "Status",
            value: isModelLoading ? "Loading model..." : isDetecting ? "Running" : "Idle",
          },
        ]}
      >
        <ObjectDetectionMediaSetting />
      </MosaicWidget.Header>
      <MosaicWidget.Body>
        <video
          ref={videoRef}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            borderRadius: "8px",
            transform: `scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`,
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
            transform: `scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`,
            transformOrigin: "center center",
          }}
        />
      </MosaicWidget.Body>
    </MosaicWidget.Root>
  );
}
