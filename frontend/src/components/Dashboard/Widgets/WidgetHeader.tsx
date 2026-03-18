import type { ReactNode } from "react";

import { Box, Flex, HStack, Icon, Text, VStack } from "@chakra-ui/react";
import { FiInfo } from "react-icons/fi";

import type { WidgetConfig } from "@/mosaic";

import { Tooltip } from "@/components/ui/tooltip.tsx";
import { useRobotInfo } from "@/hooks/useRobotInfo.ts";

export interface AdditionalInfo {
  label: string;
  value: string;
}

export interface WidgetHeaderProps {
  children?: ReactNode;
  widgetConfig: WidgetConfig;
  additionalInfo?: AdditionalInfo[];
}

export function WidgetHeader({
  children,
  widgetConfig: { type, connectors },
  additionalInfo,
}: WidgetHeaderProps) {
  const { robotInfos } = useRobotInfo();

  const tooltipContent = (
    <VStack gap={2} align="stretch" minW="180px">
      <Text fontWeight="semibold" fontSize="xs">
        Connected Robots
      </Text>
      {connectors.map((c, i) => {
        const robotInfo = robotInfos.find((r) => r.id === c.robotId);
        return (
          <HStack key={i} gap={2} justify="space-between">
            <Text fontSize="xs">{robotInfo?.name ?? c.robotId}</Text>
            <Text fontSize="xs" color="gray.400" fontFamily="mono">
              {c.connectorId}
            </Text>
          </HStack>
        );
      })}
      {additionalInfo && additionalInfo.length > 0 && (
        <Box borderTop="1px solid" borderColor="gray.600" pt={2}>
          <VStack gap={1} align="stretch">
            {additionalInfo.map((info, i) => (
              <HStack key={i} justify="space-between" fontSize="xs">
                <Text color="gray.400">{info.label}</Text>
                <Text fontFamily="mono">{info.value}</Text>
              </HStack>
            ))}
          </VStack>
        </Box>
      )}
    </VStack>
  );

  return (
    <HStack align="center" width="100%">
      <HStack gap={2} align="center" className="draggable-header" flex="1" cursor="move">
        <Text fontSize="sm" fontWeight="bold" color="green.500">
          {type}
        </Text>
        <Tooltip content={tooltipContent} positioning={{ placement: "top" }} showArrow>
          <Icon as={FiInfo} boxSize="18px" color="gray.400" cursor="default" />
        </Tooltip>
      </HStack>
      {children && (
        <Flex align="center" flexShrink={0} onClick={(e) => e.stopPropagation()}>
          {children}
        </Flex>
      )}
    </HStack>
  );
}
