import { Code } from "@chakra-ui/react";
import { useEffect, useState } from "react";

import type { JsonReceivableStore } from "@/stores/JsonReceivableStore/JsonReceivableStore.ts";
import type { WidgetProps } from "@/widgets/index.ts";

import { WidgetRoot } from "@/components/Dashboard/Widgets/WidgetComponents.tsx";
import { useMosaicStore } from "@/hooks/useMosaicStore.ts";

export default function JsonViewerWidget({ widgetConfig }: WidgetProps) {
  const { getOrCreateStore, releaseStore } = useMosaicStore();
  const [data, setData] = useState<any>(null);

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
      setData(data);
    });

    return () => {
      unsubscribe();
      releaseStore(connector);
    };
  }, [widgetConfig]);

  const formattedData = data ? JSON.stringify(data, null, 2) : "";

  return (
    <WidgetRoot widgetConfig={widgetConfig}>
      <Code display="block" h="100%" p={3} borderRadius="md" whiteSpace="pre" overflow="auto">
        {formattedData}
      </Code>
    </WidgetRoot>
  );
}
