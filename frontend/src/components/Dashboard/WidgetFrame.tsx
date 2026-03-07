import type { ReactNode } from "react";

import { VStack } from "@chakra-ui/react";

import type { WidgetConfig } from "@/mosaic";

import { WidgetBody } from "./WidgetBody";
import { WidgetFooter } from "./WidgetFooter";
import { WidgetHeader } from "./WidgetHeader";

export interface WidgetFrameProps {
  widgetConfig: WidgetConfig;
  children?: ReactNode;
  useBody?: boolean;
  showRobotInfo?: boolean;
  footerInfo?: Array<{
    label: string;
    value: string | ReactNode;
  }>;
  footerMessage?: string;
}

export function WidgetFrame({
  widgetConfig,
  children,
  useBody = true,
  showRobotInfo = true,
  footerInfo = [],
  footerMessage,
}: WidgetFrameProps) {
  return (
    <VStack gap={3} align="stretch" h="100%">
      <WidgetHeader widgetConfig={widgetConfig} showRobotInfo={showRobotInfo} />
      {useBody ? <WidgetBody>{children}</WidgetBody> : children}
      <WidgetFooter footerInfo={footerInfo} footerMessage={footerMessage} />
    </VStack>
  );
}
