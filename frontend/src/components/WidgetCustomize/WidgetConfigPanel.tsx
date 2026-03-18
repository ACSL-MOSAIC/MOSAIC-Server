import { Box, Code, Text } from "@chakra-ui/react";

import type { WidgetConfig } from "@/mosaic";

interface WidgetConfigPanelProps {
  widgetConfig: WidgetConfig;
}

export function WidgetConfigPanel({ widgetConfig }: WidgetConfigPanelProps) {
  const displayConfig = {
    id: widgetConfig.id,
    type: widgetConfig.type,
    position: widgetConfig.position,
    connectors: widgetConfig.connectors.map((c) => c.serialize()),
    params: widgetConfig.params,
  };

  return (
    <Box>
      <Text fontSize="sm" fontWeight="semibold" mb={2}>
        Widget Config
      </Text>
      <Box
        border="1px solid"
        borderColor="gray.200"
        borderRadius="md"
        p={3}
        bg="gray.50"
        overflowX="auto"
      >
        <Code fontSize="xs" whiteSpace="pre" display="block" bg="transparent">
          {JSON.stringify(displayConfig, null, 2)}
        </Code>
      </Box>
    </Box>
  );
}