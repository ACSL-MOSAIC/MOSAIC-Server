import { Box } from "@chakra-ui/react";
import { useState } from "react";
import { type Layout, Responsive, WidthProvider } from "react-grid-layout";

import type { WidgetConfig } from "@/mosaic";

import { WidgetFactory } from "@/components/Dashboard/Widgets/WidgetFactory.tsx";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

const ResponsiveGridLayout = WidthProvider(Responsive);

interface WidgetPreviewPanelProps {
  widgetConfig: WidgetConfig;
  onPositionChange: (position: { x: number; y: number; w: number; h: number }) => void;
}

export function WidgetPreviewPanel({ widgetConfig, onPositionChange }: WidgetPreviewPanelProps) {
  const [layout, setLayout] = useState<Layout[]>([
    {
      i: widgetConfig.id,
      x: 0,
      y: 0,
      w: widgetConfig.position.w,
      h: widgetConfig.position.h,
      minW: 2,
      minH: 2,
    },
  ]);

  const handleLayoutChange = (newLayout: Layout[]) => {
    setLayout(newLayout);
    const item = newLayout[0];
    if (item) {
      onPositionChange({ x: item.x, y: item.y, w: item.w, h: item.h });
    }
  };

  return (
    <ResponsiveGridLayout
      className="layout"
      layouts={{ lg: layout }}
      breakpoints={{ lg: 0 }}
      cols={{ lg: 12 }}
      rowHeight={80}
      onDragStop={handleLayoutChange}
      onResizeStop={handleLayoutChange}
      isDraggable
      isResizable
      draggableHandle=".draggable-header"
    >
      <Box
        key={widgetConfig.id}
        bg="white"
        p={3}
        paddingTop={1}
        borderRadius="sm"
        boxShadow="xs"
        height="100%"
        display="flex"
        flexDirection="column"
      >
        <WidgetFactory widgetConfig={widgetConfig} />
      </Box>
    </ResponsiveGridLayout>
  );
}
