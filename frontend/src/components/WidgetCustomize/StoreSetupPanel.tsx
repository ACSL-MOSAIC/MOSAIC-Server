import { Box, Button, HStack, Input, Text, VStack } from "@chakra-ui/react";
import { CSSProperties } from "react";

import type { StoreType } from "@/mosaic/store/interface/mosaic-store.ts";

import { getAvailableStoreTypesByCategory } from "./storeRegistry.ts";

interface StoreSetupPanelProps {
  connectorId: string;
  connectorType: string;
  allowedStoreType: StoreType | null;
  onConnectorIdChange: (id: string) => void;
  onConnectorTypeChange: (type: string) => void;
  onApply: () => void;
  isApplyDisabled: boolean;
}

const selectStyle: CSSProperties = {
  width: "100%",
  border: "1px solid #CBD5E0",
  borderRadius: "6px",
  padding: "6px 12px",
  fontSize: "14px",
  backgroundColor: "white",
};

export function StoreSetupPanel({
  connectorId,
  connectorType,
  allowedStoreType,
  onConnectorIdChange,
  onConnectorTypeChange,
  onApply,
  isApplyDisabled,
}: StoreSetupPanelProps) {
  const filteredStoreTypes = getAvailableStoreTypesByCategory(allowedStoreType);

  return (
    <VStack gap={3} align="stretch">
      <Text fontSize="sm" fontWeight="semibold">
        Connector Setup
      </Text>

      <Box>
        <Text fontSize="xs" color="gray.600" mb={1}>
          Connector ID
        </Text>
        <Input
          size="sm"
          value={connectorId}
          onChange={(e) => onConnectorIdChange(e.target.value)}
          placeholder="/test_topic"
          fontFamily="mono"
        />
      </Box>

      <Box>
        <Text fontSize="xs" color="gray.600" mb={1}>
          Store Type{allowedStoreType && ` (${allowedStoreType} only)`}
        </Text>
        <select
          style={selectStyle}
          value={connectorType}
          onChange={(e) => onConnectorTypeChange(e.target.value)}
        >
          <option value="">Select a store type...</option>
          {filteredStoreTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </Box>

      <HStack justify="flex-end">
        <Button size="sm" colorPalette="blue" onClick={onApply} disabled={isApplyDisabled}>
          Apply
        </Button>
      </HStack>
    </VStack>
  );
}
