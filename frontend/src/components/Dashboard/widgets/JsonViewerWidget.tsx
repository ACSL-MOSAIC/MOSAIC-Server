import { WidgetFrame } from "@/components/Dashboard/WidgetFrame.tsx"
import type { WidgetProps } from "@/components/Dashboard/widgets/index.ts"
import { useMosaicStore } from "@/hooks/useMosaicStore.ts"
import type JsonReceivableStore from "@/mosaic/store/impl/json-receivable-store.ts"
import { Code } from "@chakra-ui/react"
import { useEffect, useState } from "react"

export default function JsonViewerWidget({ widgetConfig }: WidgetProps) {
  const { getOrCreateStore, releaseStore } = useMosaicStore()
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    const connector = widgetConfig.connectors[0]
    const store = getOrCreateStore(connector) as JsonReceivableStore
    if (store === null) {
      return
    }
    store.subscribe((data) => {
      setData(data)
    })
    return () => {
      releaseStore(connector)
    }
  }, [widgetConfig])

  const formattedData = data ? JSON.stringify(data, null, 2) : ""

  return (
    <WidgetFrame widgetConfig={widgetConfig}>
      <Code
        display="block"
        p={3}
        borderRadius="md"
        whiteSpace="pre-wrap"
        overflowY="auto"
      >
        {formattedData}
      </Code>
    </WidgetFrame>
  )
}
