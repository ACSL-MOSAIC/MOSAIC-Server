import { WidgetFrame } from "@/components/Dashboard/WidgetFrame.tsx"
import type { WidgetProps } from "@/components/Dashboard/widgets/index.ts"
import { useMosaicStore } from "@/hooks/useMosaicStore.ts"
import type { RobotConnector } from "@/mosaic"
import type {
  ConnectionCheckReceiverStore,
  ConnectionCheckSenderStore,
} from "@/mosaic/store/impl/connection-checking-store.ts"
import { Box, HStack, Text, VStack } from "@chakra-ui/react"
import { useEffect, useRef, useState } from "react"

const MAX_MESSAGES = 200

interface ConnectionCheckData {
  messageCreated: number
  messageReceived: number
}

// function formatTimestamp(ts: number): string {
//   const date = new Date(ts)
//   const hh = date.getHours().toString().padStart(2, "0")
//   const mm = date.getMinutes().toString().padStart(2, "0")
//   const ss = date.getSeconds().toString().padStart(2, "0")
//   const ms = (ts % 1000).toFixed(3).padStart(7, "0")
//   return `${hh}:${mm}:${ss}.${ms}`
// }

export default function ConnectionCheckWidget({ widgetConfig }: WidgetProps) {
  const { getOrCreateStore, releaseStore } = useMosaicStore()
  const [connectionCheckingMessages, setConnectionCheckingMessages] = useState<
    ConnectionCheckData[]
  >([])

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    let senderConnector: RobotConnector
    let receiverConnector: RobotConnector
    const connector = widgetConfig.connectors[0]
    if (connector.connectorId.endsWith("sender")) {
      senderConnector = connector
      receiverConnector = widgetConfig.connectors[1]
    } else {
      senderConnector = widgetConfig.connectors[1]
      receiverConnector = connector
    }

    const senderStore = getOrCreateStore(
      receiverConnector,
    ) as ConnectionCheckSenderStore
    const receiverStore = getOrCreateStore(
      senderConnector,
    ) as ConnectionCheckReceiverStore

    if (senderStore === null || receiverStore === null) {
      return
    }

    receiverStore.subscribe((data) => {
      const receivedAt = performance.timeOrigin + performance.now()
      const d: ConnectionCheckData = {
        messageCreated: data.messageCreated,
        messageReceived: receivedAt,
      }
      setConnectionCheckingMessages((prev) => {
        const next = [d, ...prev]
        return next.length > MAX_MESSAGES ? next.slice(0, MAX_MESSAGES) : next
      })
    })
    const delOnAfterConnected = senderStore.onAfterConnected(() => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      intervalRef.current = setInterval(() => {
        senderStore.send({
          messageCreated: performance.timeOrigin + performance.now(),
        })
      }, 500)
    })
    const delOnAfterDisconnected = senderStore.onAfterDisconnected(() => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    })
    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      // unsubscribe()
      delOnAfterConnected()
      delOnAfterDisconnected()
      releaseStore(connector)
    }
  }, [widgetConfig])

  return (
    <WidgetFrame widgetConfig={widgetConfig}>
      <Box overflowY="auto" maxH="100%" h="100%">
        <VStack align="stretch" gap={1} p={2}>
          {connectionCheckingMessages.map((msg, i) => {
            const latency = msg.messageReceived - msg.messageCreated
            return (
              <HStack key={i} justify="space-between" gap={4}>
                <Text>latency: {(latency * 0.5).toFixed(3)} ms</Text>
                {/*<Text>created: {formatTimestamp(msg.messageCreated)}</Text>*/}
                {/*<Text>received: {formatTimestamp(msg.messageReceived)}</Text>*/}
              </HStack>
            )
          })}
        </VStack>
      </Box>
    </WidgetFrame>
  )
}
