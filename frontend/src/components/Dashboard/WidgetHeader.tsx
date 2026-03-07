import { Flex, HStack, Text } from "@chakra-ui/react";

import type { WidgetConfig } from "@/mosaic";

import { useRobotInfo } from "@/hooks/useRobotInfo.ts";

export interface WidgetHeaderProps {
  widgetConfig: WidgetConfig;
  showRobotInfo?: boolean;
}

export function WidgetHeader({
  widgetConfig: { type, connectors },
  showRobotInfo = true,
}: WidgetHeaderProps) {
  const { robotInfos } = useRobotInfo();

  return (
    <HStack cursor="move">
      <Flex justify="space-between" align="center" className="draggable-header" width="100%">
        <HStack gap={2} align="end">
          <Text fontSize="sm" fontWeight="bold" color="green.500">
            {type}
          </Text>
          {showRobotInfo && (
            <Text fontSize="xs" color="gray.600">
              Robot:{" "}
              {connectors
                .map((c) => {
                  const robotInfo = robotInfos.find((robotInfos) => robotInfos.id === c.robotId);
                  if (robotInfo) return robotInfo.name;
                  return c.robotId;
                })
                .join(", ")}
            </Text>
          )}
        </HStack>
      </Flex>

      {/*{onRemove && (*/}
      {/*  <Button*/}
      {/*    size="xs"*/}
      {/*    variant="solid"*/}
      {/*    colorScheme="teal"*/}
      {/*    onClick={(e) => {*/}
      {/*      e.stopPropagation()*/}
      {/*      onRemove()*/}
      {/*    }}*/}
      {/*  >*/}
      {/*    Remove*/}
      {/*  </Button>*/}
      {/*)}*/}
      {/*{onSettingClick && (*/}
      {/*  <IconButton*/}
      {/*    size="xs"*/}
      {/*    variant="outline"*/}
      {/*    colorScheme="teal"*/}
      {/*    onClick={(e) => {*/}
      {/*      e.stopPropagation()*/}
      {/*      onSettingClick()*/}
      {/*    }}*/}
      {/*  >*/}
      {/*    <IoSettings />*/}
      {/*  </IconButton>*/}
      {/*)}*/}
    </HStack>
  );
}
