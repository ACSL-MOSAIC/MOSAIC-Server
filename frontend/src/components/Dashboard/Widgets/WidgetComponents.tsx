import { VStack } from "@chakra-ui/react";
import { Children, type ReactNode, isValidElement } from "react";

import type { WidgetConfig } from "@/mosaic";

import { MosaicWidgetContext } from "@/components/Dashboard/Widgets/MosaicWidgetContext.tsx";
import { WidgetSettingDialog } from "@/components/Dashboard/Widgets/WidgetSettingDialog.tsx";

import { ErrorWidget } from "./ErrorWidget.tsx";
import { WidgetBody } from "./WidgetBody.tsx";
import { WidgetHeader } from "./WidgetHeader.tsx";

interface WidgetFrameProps {
  children?: ReactNode;
  widgetConfig: WidgetConfig;
  error?: string;
}

export function WidgetRoot({ widgetConfig, children, error }: WidgetFrameProps) {
  const foundHeader = Children.toArray(children).find(
    (child) => isValidElement(child) && child.type === WidgetHeader,
  );
  const foundBody = Children.toArray(children).find(
    (child) => isValidElement(child) && child.type === WidgetBody,
  );

  return (
    <MosaicWidgetContext.Provider value={widgetConfig}>
      <VStack gap={1} align="stretch" h="100%" w="100%">
        {foundHeader || <WidgetHeader />}
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
      </VStack>
    </MosaicWidgetContext.Provider>
  );
}

export { useMosaicWidget } from "@/components/Dashboard/Widgets/MosaicWidgetContext.tsx";

export const MosaicWidget = {
  Root: WidgetRoot,
  Header: WidgetHeader,
  SettingDialog: WidgetSettingDialog,
  Body: WidgetBody,
};
