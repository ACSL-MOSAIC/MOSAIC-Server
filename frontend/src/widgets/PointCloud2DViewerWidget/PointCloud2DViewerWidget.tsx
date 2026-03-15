import { Box, Flex } from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";

import type { ReceivableStore } from "@/mosaic/store/interface/receivable-store.ts";
import type {
  PointCloudData,
  PointCloudMeta,
  PointCloudPoint,
} from "@/stores/@types/pointcloud.ts";
import type { WidgetProps } from "@/widgets/index.ts";

import { WidgetFrame } from "@/components/Dashboard/WidgetFrame.tsx";
import { useMosaicStore } from "@/hooks/useMosaicStore.ts";
import AngleIndicator from "@/widgets/PointCloud2DViewerWidget/AngleIndicator.tsx";

export default function PointCloud2DViewerWidget({ widgetConfig }: WidgetProps) {
  const { getOrCreateStore, releaseStore } = useMosaicStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pointCount, setPointCount] = useState(0);

  const canvasSizeRef = useRef({ width: 0, height: 0 });
  const lastPPCMetaRef = useRef<PointCloudMeta | null>(null);
  const lastPPCPointsRef = useRef<PointCloudPoint[] | null>(null);

  const clearCanvas = (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  useEffect(() => {
    const connector = widgetConfig.connectors[0];
    if (!connector) {
      return;
    }

    const store = getOrCreateStore(connector) as ReceivableStore<PointCloudData>;
    if (store === null) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) {
      return;
    }

    const unsubscribe = store.subscribe((data) => {
      if (!data.dataPresent) {
        // skip if no data
        return;
      }

      const { meta, points } = data;

      // If the incoming frame ID differs from the previous one, treat it as a new frame
      // Reset previous frame metadata and clear canvas
      if (!lastPPCMetaRef.current || lastPPCMetaRef.current.frameId !== meta.frameId) {
        lastPPCMetaRef.current = meta;
        lastPPCPointsRef.current = null;
        clearCanvas(canvas, ctx);
      }

      // If the same frame as previous, just draw additional points without clearing canvas
      try {
        setError(null);
        setPointCount(meta.height * meta.width);

        if (lastPPCPointsRef.current === null) {
          lastPPCPointsRef.current = points;
          drawPoint(canvas, ctx, points, meta);
        } else {
          lastPPCPointsRef.current = [...lastPPCPointsRef.current, ...points];
          drawPoint(canvas, ctx, lastPPCPointsRef.current, meta);
        }
      } catch (error) {
        console.error("Error processing PointCloud2:", error);
        setError(
          `Error processing PointCloud2: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    });

    return () => {
      unsubscribe();
      releaseStore(connector);
      lastPPCMetaRef.current = null;
      lastPPCPointsRef.current = null;
    };
  }, [widgetConfig]);

  const drawPoint = (
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    points: PointCloudPoint[],
    meta: PointCloudMeta,
  ) => {
    // Get actual canvas display size and set internal resolution
    const rect = canvas.getBoundingClientRect();
    const canvasWidth = Math.floor(rect.width);
    const canvasHeight = Math.floor(rect.height);

    // Reset canvas resolution only when size changes
    if (
      canvasSizeRef.current.width !== canvasWidth ||
      canvasSizeRef.current.height !== canvasHeight
    ) {
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      canvasSizeRef.current = { width: canvasWidth, height: canvasHeight };
    }

    // Check minimum size
    if (canvasWidth <= 0 || canvasHeight <= 0) {
      return;
    }

    // Initialize depth map, height map, and intensity map for 2D projection
    const n = canvasWidth * canvasHeight;
    const depthMap = Array.from<number>({ length: n }).fill(Number.POSITIVE_INFINITY);
    const heightMap = Array.from<number>({ length: n }).fill(0);

    let minHeight = meta.min_z;
    let maxHeight = meta.max_z;

    // Set default values
    const heightRange = maxHeight - minHeight;
    if (heightRange === 0) {
      minHeight = -1;
      maxHeight = 1;
    }

    // Actual projection and mapping
    for (let i = 0; i < points.length; i++) {
      const { x, y, z } = points[i];
      if (x === null || y === null || z === null) {
        continue;
      }

      const distance = Math.sqrt(x * x + y * y);
      if (distance === 0) continue;

      const azimuth = Math.atan2(y, x);
      const u = Math.floor(((azimuth + Math.PI) / (2 * Math.PI)) * canvasWidth);

      // Map height to canvas Y coordinate (top is higher elevation)
      const v = Math.floor(((maxHeight - z) / (maxHeight - minHeight)) * (canvasHeight - 1));

      // Range check
      if (u >= 0 && u < canvasWidth && v >= 0 && v < canvasHeight) {
        const pixelIndex = v * canvasWidth + u;
        // Use closest distance when multiple points map to same pixel
        if (distance < depthMap[pixelIndex]) {
          depthMap[pixelIndex] = distance;
          heightMap[pixelIndex] = z;
        }
      }
    }

    // Create image data
    const imageData = ctx.createImageData(canvas.width, canvas.height);

    // Convert depth map, height map, and intensity map to image
    for (let pixelIndex = 0; pixelIndex < depthMap.length; pixelIndex++) {
      if (depthMap[pixelIndex] !== Number.POSITIVE_INFINITY) {
        // Set color values in image data
        const imageIndex = pixelIndex * 4;
        imageData.data[imageIndex] = 255; // R
        imageData.data[imageIndex + 1] = 255; // G
        imageData.data[imageIndex + 2] = 255; // B
        imageData.data[imageIndex + 3] = 255; // A
      }
    }

    // Draw image data to canvas
    ctx.putImageData(imageData, 0, 0);
    setPointCount(points.length);
    setLastUpdate(new Date());
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
    <WidgetFrame widgetConfig={widgetConfig} footerInfo={footerInfo}>
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
          <AngleIndicator height="20px" fontSize="10px" fontColor="gray.300" />
          <canvas
            ref={canvasRef}
            style={{
              width: "100%",
              height: "calc(100% - 20px)",
              objectFit: "contain",
              borderRadius: "6px",
            }}
          />
        </>
      )}
    </WidgetFrame>
  );
}
