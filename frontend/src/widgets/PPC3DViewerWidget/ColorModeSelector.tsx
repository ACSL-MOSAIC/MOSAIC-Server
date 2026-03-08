import { Button, ButtonGroup, Flex, Text } from "@chakra-ui/react";

import { Tooltip } from "@/components/ui/tooltip.tsx";

import type { ColorMode } from "./colorMapping.ts";

interface ColorModeSelectorProps {
  colorMode: ColorMode;
  onChange: (mode: ColorMode) => void;
}

export default function ColorModeSelector({ colorMode, onChange }: ColorModeSelectorProps) {
  const colorModeOptions: { value: ColorMode; label: string; tooltip: string }[] = [
    { value: "height", label: "Height", tooltip: "Color by elevation (blue=low, red=high)" },
    {
      value: "intensity",
      label: "Intensity",
      tooltip: "Color by reflection intensity (grayscale)",
    },
    { value: "depth", label: "Depth", tooltip: "Color by distance (red=close, blue=far)" },
    { value: "hybrid", label: "Hybrid", tooltip: "Height as color, intensity as opacity" },
  ];

  return (
    <Flex justify="space-between" align="center" px={2} py={1} gap={2} flexWrap="wrap">
      <Text fontSize="xs" color="gray.400" fontWeight="medium">
        Color Mode:
      </Text>
      <ButtonGroup size="xs" attached variant="outline">
        {colorModeOptions.map((option) => (
          <Tooltip
            key={option.value}
            content={option.tooltip}
            positioning={{ placement: "top" }}
            showArrow
          >
            <Button
              onClick={() => onChange(option.value)}
              colorScheme={colorMode === option.value ? "blue" : "gray"}
              bg={colorMode === option.value ? "blue.500" : "transparent"}
              color={colorMode === option.value ? "white" : "gray.300"}
              _hover={{
                bg: colorMode === option.value ? "blue.600" : "whiteAlpha.100",
              }}
              fontSize="xs"
              px={2}
            >
              {option.label}
            </Button>
          </Tooltip>
        ))}
      </ButtonGroup>
    </Flex>
  );
}