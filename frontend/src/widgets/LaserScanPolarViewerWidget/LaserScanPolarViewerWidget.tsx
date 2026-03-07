import { Box } from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";

import type { JsonReceivableStore } from "@/stores/JsonReceivableStore/JsonReceivableStore.ts";
import type { WidgetProps } from "@/widgets/index.ts";

import { WidgetFrame } from "@/components/Dashboard/WidgetFrame.tsx";
import { useMosaicStore } from "@/hooks/useMosaicStore.ts";

interface LaserScanData {
  angle_increment: number;
  angle_max: number;
  angle_min: number;
  intensities: number[];
  range_max: number;
  range_min: number;
  ranges: number[];
  scan_time: number;
  time_increment: number;
}

export default function LaserScanPolarViewerWidget({ widgetConfig }: WidgetProps) {
  const { getOrCreateStore, releaseStore } = useMosaicStore();
  const [data, setData] = useState<LaserScanData | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const connector = widgetConfig.connectors[0];
    if (!connector) {
      return;
    }
    const store = getOrCreateStore(connector) as JsonReceivableStore;
    if (store === null) {
      return;
    }

    const unsubscribe = store.subscribe((data) => {
      setData(data as LaserScanData);
    });

    return () => {
      unsubscribe();
      releaseStore(connector);
    };
  }, [widgetConfig]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Canvas 크기를 부모 크기에 맞춤
    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (!parent) return;

      const rect = parent.getBoundingClientRect();
      const size = Math.min(rect.width, rect.height);
      canvas.width = size;
      canvas.height = size;
      drawPolarPlot();
    };

    const drawPolarPlot = () => {
      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;
      const maxRadius = Math.min(centerX, centerY) * 0.9;

      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // Draw background circles (range indicators)
      ctx.strokeStyle = "#e5e7eb";
      ctx.lineWidth = 1;
      const numCircles = 5;
      for (let i = 1; i <= numCircles; i++) {
        const radius = (maxRadius * i) / numCircles;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.stroke();

        // Draw range labels
        ctx.fillStyle = "#9ca3af";
        ctx.font = "10px monospace";
        ctx.textAlign = "center";
        const rangeValue = ((data.range_max * i) / numCircles).toFixed(1);
        ctx.fillText(`${rangeValue}m`, centerX, centerY - radius + 12);
      }

      // Draw angle lines (0°, 90°, 180°, 270°)
      ctx.strokeStyle = "#d1d5db";
      ctx.lineWidth = 1;
      const angles = [0, 90, 180, 270];
      angles.forEach((deg) => {
        const rad = (deg * Math.PI) / 180;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(
          centerX + maxRadius * Math.cos(rad - Math.PI / 2),
          centerY + maxRadius * Math.sin(rad - Math.PI / 2),
        );
        ctx.stroke();

        // Draw angle labels
        ctx.fillStyle = "#6b7280";
        ctx.font = "12px sans-serif";
        const labelRadius = maxRadius + 15;
        const labelX = centerX + labelRadius * Math.cos(rad - Math.PI / 2);
        const labelY = centerY + labelRadius * Math.sin(rad - Math.PI / 2);
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(`${deg}°`, labelX, labelY);
      });

      // Draw laser scan points
      ctx.fillStyle = "#3b82f6";
      const { ranges, angle_min, angle_increment, range_max } = data;

      ranges.forEach((range, i) => {
        // Skip invalid readings
        if (range === 0 || range > range_max) return;

        const angle = angle_min + i * angle_increment;
        // Convert to canvas coordinates (rotate -90° to make 0° point up)
        const canvasAngle = angle - Math.PI / 2;
        const r = (range / range_max) * maxRadius;

        const x = centerX + r * Math.cos(canvasAngle);
        const y = centerY + r * Math.sin(canvasAngle);

        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw center point (sensor position)
      ctx.fillStyle = "#ef4444";
      ctx.beginPath();
      ctx.arc(centerX, centerY, 4, 0, Math.PI * 2);
      ctx.fill();
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [data]);

  return (
    <WidgetFrame widgetConfig={widgetConfig}>
      <Box h="100%" display="flex" alignItems="center" justifyContent="center" bg="white">
        <canvas ref={canvasRef} style={{ display: "block" }} />
      </Box>
    </WidgetFrame>
  );
}
