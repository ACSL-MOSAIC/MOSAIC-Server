import { VStack } from "@chakra-ui/react";
import { Children, isValidElement, ReactNode } from "react";

import type { WidgetConfig } from "@/mosaic";

import { WidgetSettingDialog } from "@/components/Dashboard/Widgets/WidgetSettingDialog.tsx";

import { ErrorWidget } from "./ErrorWidget.tsx";
import { WidgetBody } from "./WidgetBody.tsx";
import { WidgetFooter } from "./WidgetFooter.tsx";
import { WidgetHeader } from "./WidgetHeader.tsx";

interface WidgetFrameProps {
  children?: ReactNode;
  widgetConfig: WidgetConfig;
  error?: string;
}

function WidgetRoot({ widgetConfig, children, error }: WidgetFrameProps) {
  const foundHeader = Children.toArray(children).find(
    (child) => isValidElement(child) && child.type === WidgetHeader,
  );
  const foundBody = Children.toArray(children).find(
    (child) => isValidElement(child) && child.type === WidgetBody,
  );
  const foundFooter = Children.toArray(children).find(
    (child) => isValidElement(child) && child.type === WidgetFooter,
  );

  return (
    <VStack gap={3} align="stretch" h="100%">
      {foundHeader || <WidgetHeader widgetConfig={widgetConfig} />}
      {error ? (
        <WidgetBody>
          <ErrorWidget error={error} />
        </WidgetBody>
      ) : (
        foundBody || (
          <WidgetBody>
            <ErrorWidget error={"No Contents defined"} />
          </WidgetBody>
        )
      )}
      {foundFooter}
    </VStack>
  );
}

export const MosaicWidget = {
  Root: WidgetRoot,
  Header: WidgetHeader,
  SettingDialog: WidgetSettingDialog,
  Body: WidgetBody,
  Footer: WidgetFooter,
};
