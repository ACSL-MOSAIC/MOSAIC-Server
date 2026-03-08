import { Box, Button, Flex, IconButton, Slider, Text } from "@chakra-ui/react";
import { useState } from "react";

import { Tooltip } from "@/components/ui/tooltip.tsx";

interface ViewControlsProps {
  pointSize: number;
  showAxes: boolean;
  autoRotate: boolean;
  onPointSizeChange: (size: number) => void;
  onShowAxesToggle: () => void;
  onAutoRotateToggle: () => void;
  onResetCamera: () => void;
  cameraPosition?: { x: number; y: number; z: number };
}

export default function ViewControls({
  pointSize,
  showAxes,
  autoRotate,
  onPointSizeChange,
  onShowAxesToggle,
  onAutoRotateToggle,
  onResetCamera,
  cameraPosition,
}: ViewControlsProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <Flex direction="column" gap={2} px={2} py={1}>
      {/* Main Controls Row */}
      <Flex justify="space-between" align="center" gap={2} flexWrap="wrap">
        {/* Point Size Slider */}
        <Flex align="center" gap={2} flex="1" minW="200px">
          <Text fontSize="xs" color="gray.400" fontWeight="medium" whiteSpace="nowrap">
            Point Size:
          </Text>
          <Slider
            value={pointSize * 1000}
            onChange={(val) => onPointSizeChange(val / 1000)}
            min={10}
            max={200}
            step={5}
            w="120px"
          >
            <Slider.Track bg="gray.700">
              <Slider.FilledTrack bg="blue.500" />
            </Slider.Track>
            <Slider.Thumb />
          </Slider>
          <Text fontSize="xs" color="gray.500" w="30px">
            {Math.round(pointSize * 1000)}
          </Text>
        </Flex>

        {/* Action Buttons */}
        <Flex gap={1}>
          <Tooltip content="Toggle coordinate axes (X: red, Y: green, Z: blue)" showArrow>
            <Button
              size="xs"
              variant={showAxes ? "solid" : "outline"}
              colorScheme={showAxes ? "blue" : "gray"}
              onClick={onShowAxesToggle}
              px={2}
            >
              Axes
            </Button>
          </Tooltip>

          <Tooltip content="Auto-rotate the view" showArrow>
            <Button
              size="xs"
              variant={autoRotate ? "solid" : "outline"}
              colorScheme={autoRotate ? "blue" : "gray"}
              onClick={onAutoRotateToggle}
              px={2}
            >
              Rotate
            </Button>
          </Tooltip>

          <Tooltip content="Reset camera to initial position" showArrow>
            <Button size="xs" variant="outline" colorScheme="gray" onClick={onResetCamera} px={2}>
              Reset
            </Button>
          </Tooltip>

          <Tooltip
            content={showAdvanced ? "Hide camera info" : "Show camera info"}
            showArrow
          >
            <IconButton
              size="xs"
              variant="outline"
              colorScheme="gray"
              onClick={() => setShowAdvanced(!showAdvanced)}
              aria-label="Toggle advanced info"
            >
              {showAdvanced ? "▼" : "▶"}
            </IconButton>
          </Tooltip>
        </Flex>
      </Flex>

      {/* Advanced Info (Collapsible) */}
      {showAdvanced && cameraPosition && (
        <Box
          bg="whiteAlpha.50"
          borderRadius="md"
          px={2}
          py={1}
          fontSize="xs"
          color="gray.400"
        >
          <Text fontFamily="mono">
            Camera: ({cameraPosition.x.toFixed(2)}, {cameraPosition.y.toFixed(2)},{" "}
            {cameraPosition.z.toFixed(2)})
          </Text>
        </Box>
      )}
    </Flex>
  );
}