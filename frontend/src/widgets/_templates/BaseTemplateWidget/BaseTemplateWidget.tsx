import { useEffect, useState } from "react";

import type { JsonReceivableStore } from "@/stores/JsonReceivableStore/JsonReceivableStore.ts";
import type { WidgetProps } from "@/widgets";

import { MosaicWidget } from "@/components/Dashboard/Widgets/WidgetComponents.tsx";
import { useMosaicStore } from "@/hooks/useMosaicStore.ts";
import { BaseTemplateSetting } from "@/widgets/_templates/BaseTemplateWidget/BaseTemplateSetting.tsx";

export default function BaseTemplateWidget({ widgetConfig }: WidgetProps) {
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

  return (
    <MosaicWidget.Root widgetConfig={widgetConfig}>
      <MosaicWidget.Header widgetConfig={widgetConfig}>
        <BaseTemplateSetting widgetConfig={widgetConfig} />
      </MosaicWidget.Header>
      <MosaicWidget.Body>
        Customize this widget
        {data}
      </MosaicWidget.Body>
      <MosaicWidget.Footer
        footerInfo={[{ label: "Info1", value: "Value1" }]}
        footerMessage={"Customize this footer message"}
      />
    </MosaicWidget.Root>
  );
}
