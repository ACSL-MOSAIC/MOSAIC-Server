import { WidgetFrame } from "@/components/Dashboard/WidgetFrame.tsx"
import { useMosaicStore } from "@/hooks/useMosaicStore.ts"
import type { WidgetConfig } from "@/mosaic"
import { useEffect } from "react"

interface JsonViewerWidgetProps {
  widgetConfig: WidgetConfig
}

export default function JsonViewerWidget({
  widgetConfig,
}: JsonViewerWidgetProps) {
  const { getOrCreateStore, releaseStore } = useMosaicStore()

  useEffect(() => {
    widgetConfig.connectors.forEach((connector) => {
      const store = getOrCreateStore(connector)
    })
    return () => {
      widgetConfig.connectors.forEach((connector) => releaseStore(connector))
    }
  }, [getOrCreateStore, releaseStore])

  return <WidgetFrame widgetConfig={widgetConfig}>Hello?</WidgetFrame>
}
