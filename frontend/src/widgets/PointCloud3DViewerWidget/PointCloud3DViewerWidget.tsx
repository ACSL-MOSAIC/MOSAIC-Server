import { Box, Button } from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";

import type { ReceivableStore } from "@/mosaic/store/interface/receivable-store.ts";
import type {
  PointCloudData,
  PointCloudMeta,
  PointCloudPoint,
} from "@/stores/@types/pointcloud.ts";
import type { WidgetProps } from "@/widgets/index.ts";

import { MosaicWidget } from "@/components/Dashboard/Widgets/WidgetComponents.tsx";
import { useMosaicStore } from "@/hooks/useMosaicStore.ts";

import type { ColorMode } from "./colorMapping.ts";

import { PointCloud3DViewerSetting } from "./PointCloud3DViewerSetting.tsx";
import { ThreeScene } from "./ThreeScene.ts";

export default function PointCloud3DViewerWidget({ widgetConfig }: WidgetProps) {
  const { getOrCreateStore, releaseStore } = useMosaicStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const threeSceneRef = useRef<ThreeScene | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pointCount, setPointCount] = useState(0);

  const colorMode = (widgetConfig.params?.colorMode as ColorMode) ?? "height";
  const colorModeRef = useRef<ColorMode>(colorMode);
  const pointSize = (widgetConfig.params?.pointSize as number) ?? 0.05;
  const showAxes = (widgetConfig.params?.showAxes as boolean) ?? false;
  const autoRotate = (widgetConfig.params?.autoRotate as boolean) ?? false;

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

      return () => {
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

  // params 변경 시 Three.js scene에 즉시 반영
  useEffect(() => {
    const scene = threeSceneRef.current;
    if (!scene) return;
    colorModeRef.current = colorMode;
    scene.setPointSize(pointSize);
    scene.setShowAxes(showAxes);
    scene.setAutoRotate(autoRotate);
    if (lastPCPointsRef.current && lastPCMetaRef.current) {
      scene.updatePoints(lastPCPointsRef.current, lastPCMetaRef.current, colorMode);
    }
  }, [colorMode, pointSize, showAxes, autoRotate]);

  const handleResetCamera = () => {
    threeSceneRef.current?.resetCamera();
  };

  const additionalInfo = [
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
    <MosaicWidget.Root widgetConfig={widgetConfig} error={error}>
      <MosaicWidget.Header additionalInfo={additionalInfo}>
        <Button size="xs" variant="outline" onClick={handleResetCamera}>
          Reset
        </Button>
        <PointCloud3DViewerSetting />
      </MosaicWidget.Header>
      <MosaicWidget.Body>
        <Box
          ref={containerRef}
          h="100%"
          w="100%"
          position="relative"
          borderRadius="6px"
          overflow="hidden"
        />
      </MosaicWidget.Body>
    </MosaicWidget.Root>
  );
}
