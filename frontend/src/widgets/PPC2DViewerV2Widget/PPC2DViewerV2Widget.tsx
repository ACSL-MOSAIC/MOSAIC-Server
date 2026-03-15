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

import AngleIndicator from "./AngleIndicator.tsx";
import { calculateColor, calculatePointSize, type ColorMode } from "./colorMapping.ts";
import ColorModeSelector from "./ColorModeSelector.tsx";

export default function PPC2DViewerV2Widget({ widgetConfig }: WidgetProps) {
  const { getOrCreateStore, releaseStore } = useMosaicStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pointCount, setPointCount] = useState(0);

  const canvasSizeRef = useRef({ width: 0, height: 0 });
  const lastPPCMetaRef = useRef<PointCloudMeta | null>(null);
  const lastPPCPointsRef = useRef<PointCloudPoint[] | null>(null);
  const [colorMode, setColorMode] = useState<ColorMode>("height"); // Default to height-based coloring

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
          // First chunk of new frame - draw all points
          lastPPCPointsRef.current = points;
          drawPoint(canvas, ctx, points, meta, false);
        } else {
          // Subsequent chunks - only draw new points
          drawPoint(canvas, ctx, points, meta, true);
          lastPPCPointsRef.current = [...lastPPCPointsRef.current, ...points];
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
    incremental = false, // If true, only render new points without clearing
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
      // Clear canvas when resizing
      clearCanvas(canvas, ctx);
    }

    // Check minimum size
    if (canvasWidth <= 0 || canvasHeight <= 0) {
      return;
    }

    // Calculate max distance for point size calculation
    const maxDistance = Math.sqrt(meta.max_x * meta.max_x + meta.max_y * meta.max_y);

    // Depth buffer to handle occlusion
    // Store points with their screen coordinates and depth for rendering
    interface PointData {
      x: number;
      y: number;
      distance: number;
      point: PointCloudPoint;
    }

    const pointsToRender: PointData[] = [];

    // Project all points to screen space
    for (let i = 0; i < points.length; i++) {
      const point = points[i];
      const { x, y, z } = point;

      if (x === null || y === null || z === null) {
        continue;
      }

      const distance = Math.sqrt(x * x + y * y);
      if (distance === 0) continue;

      // Cylindrical projection
      const azimuth = Math.atan2(y, x);
      const screenX = ((azimuth + Math.PI) / (2 * Math.PI)) * canvasWidth;

      // Map height to canvas Y coordinate (top is higher elevation)
      const heightRange = meta.max_z - meta.min_z || 1;
      const screenY = ((meta.max_z - z) / heightRange) * canvasHeight;

      pointsToRender.push({
        x: screenX,
        y: screenY,
        distance,
        point,
      });
    }

    // Sort by distance (far to near) for proper rendering order
    // Only sort when not doing incremental rendering for better performance
    if (!incremental) {
      pointsToRender.sort((a, b) => b.distance - a.distance);
    }

    // Render each point as a circle
    for (const { x, y, distance, point } of pointsToRender) {
      // Calculate color based on current mode
      const [r, g, b, a] = calculateColor(point, meta, colorMode);

      // Calculate point size based on distance
      const size = calculatePointSize(distance, maxDistance);

      // Set fill style with calculated color
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a / 255})`;

      // Draw point as a filled circle
      ctx.beginPath();
      ctx.arc(x, y, size / 2, 0, Math.PI * 2);
      ctx.fill();
    }

    setPointCount(points.length);
    setLastUpdate(new Date());
  };

  const handleColorModeChange = (mode: ColorMode) => {
    setColorMode(mode);
    // Redraw with new color mode
    if (canvasRef.current && lastPPCPointsRef.current && lastPPCMetaRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) {
        clearCanvas(canvasRef.current, ctx);
        drawPoint(canvasRef.current, ctx, lastPPCPointsRef.current, lastPPCMetaRef.current, false);
      }
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
    {
      label: "Mode",
      value: colorMode.charAt(0).toUpperCase() + colorMode.slice(1),
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
        <Flex direction="column" h="100%" position="relative">
          <ColorModeSelector colorMode={colorMode} onChange={handleColorModeChange} />
          <AngleIndicator />
          <Box flex="1" position="relative">
            <canvas
              ref={canvasRef}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                borderRadius: "6px",
              }}
            />
          </Box>
        </Flex>
      )}
    </WidgetFrame>
  );
}
