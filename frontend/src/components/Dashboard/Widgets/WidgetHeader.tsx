import { Flex, HStack, Text } from "@chakra-ui/react";
import { Children, isValidElement, ReactNode } from "react";

import type { WidgetConfig } from "@/mosaic";

import { WidgetSettingDialog } from "@/components/Dashboard/Widgets/WidgetSettingDialog.tsx";
import { useRobotInfo } from "@/hooks/useRobotInfo.ts";

export interface WidgetHeaderProps {
  children?: ReactNode;
  widgetConfig: WidgetConfig;
}

export function WidgetHeader({ children, widgetConfig: { type, connectors } }: WidgetHeaderProps) {
  const { robotInfos } = useRobotInfo();

  const foundSettingDialog = Children.toArray(children).find(
    (child) => isValidElement(child) && child.type === WidgetSettingDialog,
  );

  return (
    <HStack cursor="move">
      <Flex justify="space-between" align="center" className="draggable-header" width="100%">
        <HStack gap={2} align="end">
          <Text fontSize="sm" fontWeight="bold" color="green.500">
            {type}
          </Text>
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
          {foundSettingDialog}
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
    </HStack>
  );
}
