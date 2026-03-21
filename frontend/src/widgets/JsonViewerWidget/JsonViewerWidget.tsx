import { Code } from "@chakra-ui/react";
import { useEffect, useState } from "react";

import type { JsonReceivableStore } from "@/stores/JsonReceivableStore/JsonReceivableStore.ts";
import type { WidgetProps } from "@/widgets/index.ts";

import { MosaicWidget } from "@/components/Dashboard/Widgets/WidgetComponents.tsx";
import { useMosaicStore } from "@/hooks/useMosaicStore.ts";
import { JsonViewerSetting } from "@/widgets/JsonViewerWidget/JsonViewerSetting.tsx";

export default function JsonViewerWidget({ widgetConfig }: WidgetProps) {
  const { getOrCreateStore, releaseStore } = useMosaicStore();
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    const connector = widgetConfig.connectors[0];
    if (!connector) {
      return;
    }

    const store = getOrCreateStore(connector) as JsonReceivableStore;
    if (store === null) {
      return;
    }

    const unsubscribe = store.subscribe((data) => {
      if (widgetConfig.params.cumulative) {
        setData((prevData) => [...prevData, data]);
      } else {
        setData([data]);
      }
    });

    return () => {
      unsubscribe();
      releaseStore(connector);
    };
  }, [widgetConfig]);

  const formattedData = data.map((d) => JSON.stringify(d, null, 2)).join("\n");

  return (
    <MosaicWidget.Root widgetConfig={widgetConfig}>
      <MosaicWidget.Header>
        <JsonViewerSetting />
      </MosaicWidget.Header>
      <MosaicWidget.Body>
        <Code
          display="block"
          h="100%"
          w="100%"
          p={3}
          borderRadius="md"
          whiteSpace="pre"
          overflow="auto"
        >
          {formattedData}
        </Code>
      </MosaicWidget.Body>
    </MosaicWidget.Root>
  );
}
