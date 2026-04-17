import { Box, Text } from "@chakra-ui/react";
import { CSSProperties } from "react";

import { getAvailableWidgetTypes } from "@/widgets/_utils/widgetRegistry.ts";

interface WidgetSelectorProps {
  value: string;
  onChange: (type: string) => void;
}

const selectStyle: CSSProperties = {
  width: "100%",
  border: "1px solid #CBD5E0",
  borderRadius: "6px",
  padding: "6px 12px",
  fontSize: "14px",
  backgroundColor: "white",
};

export function WidgetSelector({ value, onChange }: WidgetSelectorProps) {
  return (
    <Box>
      <Text fontSize="sm" fontWeight="semibold" mb={1}>
        Widget Type
      </Text>
      <select style={selectStyle} value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">Select a widget...</option>
        {getAvailableWidgetTypes().map((type) => (
          <option key={type} value={type}>
            {type}
          </option>
        ))}
      </select>
    </Box>
  );
}
