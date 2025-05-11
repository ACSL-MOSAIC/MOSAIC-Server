import React from "react";
import { Box, Heading } from "@chakra-ui/react";
import { Stat, StatLabel, StatNumber, StatGroup } from "@chakra-ui/stat";
import { PositionData } from "../../types/robot-control";

interface PositionDisplayProps {
  position: PositionData | null;
}

export const PositionDisplay: React.FC<PositionDisplayProps> = ({ position }) => {
  return (
    <Box p={4} borderWidth="1px" borderRadius="lg">
      <Heading size="md" mb={4}>Position</Heading>
      <StatGroup>
        <Stat>
          <StatLabel>X</StatLabel>
          <StatNumber>{position?.x.toFixed(2) ?? "0.00"}</StatNumber>
        </Stat>
        <Stat>
          <StatLabel>Y</StatLabel>
          <StatNumber>{position?.y.toFixed(2) ?? "0.00"}</StatNumber>
        </Stat>
        <Stat>
          <StatLabel>Theta</StatLabel>
          <StatNumber>{position?.theta.toFixed(2) ?? "0.00"}</StatNumber>
        </Stat>
      </StatGroup>
    </Box>
  );
}; 