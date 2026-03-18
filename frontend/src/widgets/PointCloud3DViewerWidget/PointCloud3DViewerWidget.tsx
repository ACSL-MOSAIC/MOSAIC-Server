import { Box, Flex } from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";

import type { ReceivableStore } from "@/mosaic/store/interface/receivable-store.ts";
import type {
  PointCloudData,
  PointCloudMeta,
  PointCloudPoint,
} from "@/stores/@types/pointcloud.ts";
import type { WidgetProps } from "@/widgets/index.ts";

import { WidgetRoot } from "@/components/Dashboard/Widgets/WidgetComponents.tsx";
import { useMosaicStore } from "@/hooks/useMosaicStore.ts";

import type { ColorMode } from "./colorMapping.ts";

import ColorModeSelector from "./ColorModeSelector.tsx";
import { ThreeScene } from "./ThreeScene.ts";
import ViewControls from "./ViewControls.tsx";

export default function PointCloud3DViewerWidget({ widgetConfig }: WidgetProps) {
  const { getOrCreateStore, releaseStore } = useMosaicStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const threeSceneRef = useRef<ThreeScene | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pointCount, setPointCount] = useState(0);
  const [colorMode, setColorMode] = useState<ColorMode>("height");
  const colorModeRef = useRef<ColorMode>("height");
  const [pointSize, setPointSize] = useState(0.05);
  const [showAxes, setShowAxes] = useState(false);
  const [autoRotate, setAutoRotate] = useState(false);
  const [cameraPosition, setCameraPosition] = useState({ x: -5, y: 0, z: 3 });

  const lastPCMetaRef = useRef<PointCloudMeta | null>(null);
  const lastPCPointsRef = useRef<PointCloudPoint[] | null>(null);

  // Initialize Three.js scene
  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    try {
      // Create Three.js scene
      const scene = new ThreeScene(container, {
        pointSize,
        showAxes,
        autoRotate,
      });
      threeSceneRef.current = scene;

      // Setup resize observer
      const resizeObserver = new ResizeObserver(() => {
        if (scene && container) {
          scene.resize(container.clientWidth, container.clientHeight);
        }
      });
      resizeObserver.observe(container);
      resizeObserverRef.current = resizeObserver;

      // Update camera position periodically
      const intervalId = setInterval(() => {
        if (scene) {
          setCameraPosition(scene.getCameraPosition());
        }
      }, 100);

      return () => {
        clearInterval(intervalId);
        resizeObserver.disconnect();
        scene.dispose();
        threeSceneRef.current = null;
      };
    } catch (err) {
      console.error("Error initializing Three.js scene:", err);
      setError(
        `Failed to initialize 3D viewer: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }, []);

  // Subscribe to point cloud data
  useEffect(() => {
    const connector = widgetConfig.connectors[0];
    if (!connector) {
      return;
    }

    const store = getOrCreateStore(connector) as ReceivableStore<PointCloudData>;
    if (store === null) {
      return;
    }

    const unsubscribe = store.subscribe((data) => {
      if (!data.dataPresent) {
        return;
      }

      const { meta, points } = data;
      const scene = threeSceneRef.current;

      if (!scene) {
        return;
      }

      try {
        setError(null);
        setPointCount(meta.height * meta.width);

        // New frame - clear and update
        if (!lastPCMetaRef.current || lastPCMetaRef.current.frameId !== meta.frameId) {
          lastPCMetaRef.current = meta;
          lastPCPointsRef.current = points;
          scene.clear();
          scene.updatePoints(points, meta, colorModeRef.current);
        }
        // Same frame - add points progressively
        else {
          const allPoints = lastPCPointsRef.current
            ? [...lastPCPointsRef.current, ...points]
            : points;
          lastPCPointsRef.current = allPoints;
          scene.addPoints(points, allPoints, meta, colorModeRef.current);
        }

        setLastUpdate(new Date());
      } catch (err) {
        console.error("Error processing point cloud:", err);
        setError(
          `Error processing point cloud: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    });

    return () => {
      unsubscribe();
      releaseStore(connector);
      lastPCMetaRef.current = null;
      lastPCPointsRef.current = null;
    };
  }, [widgetConfig]);

  // Handle color mode change
  const handleColorModeChange = (mode: ColorMode) => {
    setColorMode(mode);
    colorModeRef.current = mode;
    const scene = threeSceneRef.current;
    if (scene && lastPCPointsRef.current && lastPCMetaRef.current) {
      scene.updatePoints(lastPCPointsRef.current, lastPCMetaRef.current, mode);
    }
  };

  // Handle point size change
  const handlePointSizeChange = (size: number) => {
    setPointSize(size);
    const scene = threeSceneRef.current;
    if (scene) {
      scene.setPointSize(size);
    }
  };

  // Handle show axes toggle
  const handleShowAxesToggle = () => {
    const newValue = !showAxes;
    setShowAxes(newValue);
    const scene = threeSceneRef.current;
    if (scene) {
      scene.setShowAxes(newValue);
    }
  };

  // Handle auto-rotate toggle
  const handleAutoRotateToggle = () => {
    const newValue = !autoRotate;
    setAutoRotate(newValue);
    const scene = threeSceneRef.current;
    if (scene) {
      scene.setAutoRotate(newValue);
    }
  };

  // Handle reset camera
  const handleResetCamera = () => {
    const scene = threeSceneRef.current;
    if (scene) {
      scene.resetCamera();
    }
  };

  const footerInfo = [
    {
      label: "Points",
      value: pointCount.toLocaleString(),
    },
    {
      label: "Last Update",
      value: lastUpdate ? lastUpdate.toLocaleTimeString() : "N/A",
    },
  ];

  return (
    <WidgetRoot widgetConfig={widgetConfig} footerInfo={footerInfo}>
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
        <Flex direction="column" h="100%" w="100%" position="relative">
          {/* Color Mode Controls */}
          <ColorModeSelector colorMode={colorMode} onChange={handleColorModeChange} />

          {/* View Controls */}
          <ViewControls
            pointSize={pointSize}
            showAxes={showAxes}
            autoRotate={autoRotate}
            onPointSizeChange={handlePointSizeChange}
            onShowAxesToggle={handleShowAxesToggle}
            onAutoRotateToggle={handleAutoRotateToggle}
            onResetCamera={handleResetCamera}
            cameraPosition={cameraPosition}
          />

          {/* Three.js Container */}
          <Box
            ref={containerRef}
            flex="1"
            w="100%"
            position="relative"
            borderRadius="6px"
            overflow="hidden"
          />
        </Flex>
      )}
    </WidgetRoot>
  );
}
