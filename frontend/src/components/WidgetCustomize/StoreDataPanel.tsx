import { Badge, Box, Button, Code, HStack, Text, Textarea, VStack } from "@chakra-ui/react";
import { useState } from "react";

interface ReceivableDataPanelProps {
  onInject: (rawData: string) => void;
  defaultData: string;
}

function ReceivableDataPanel({ onInject, defaultData }: ReceivableDataPanelProps) {
  const [input, setInput] = useState(defaultData);

  return (
    <VStack gap={2} align="stretch">
      <Text fontSize="xs" color="gray.600">
        Inject raw data (simulates data arriving from the robot)
      </Text>
      <Textarea
        size="sm"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Enter raw data string..."
        fontFamily="mono"
        rows={4}
      />
      <HStack justify="flex-end">
        <Button size="sm" colorPalette="green" onClick={() => onInject(input)}>
          Inject
        </Button>
      </HStack>
    </VStack>
  );
}

interface SendableDataPanelProps {
  sentDataLog: string[];
  onClearLog: () => void;
}

function SendableDataPanel({ sentDataLog, onClearLog }: SendableDataPanelProps) {
  return (
    <VStack gap={2} align="stretch">
      <HStack justify="space-between">
        <Text fontSize="xs" color="gray.600">
          Sent data log (intercepted from widget → store)
        </Text>
        <Button size="xs" variant="ghost" onClick={onClearLog}>
          Clear
        </Button>
      </HStack>
      <Box
        border="1px solid"
        borderColor="gray.200"
        borderRadius="md"
        p={2}
        h="150px"
        overflowY="auto"
        bg="gray.50"
      >
        {sentDataLog.length === 0 ? (
          <Text fontSize="xs" color="gray.400">
            No data sent yet...
          </Text>
        ) : (
          <VStack gap={1} align="stretch">
            {sentDataLog.map((entry, i) => (
              <Code key={i} fontSize="xs" whiteSpace="pre-wrap" wordBreak="break-all">
                {entry}
              </Code>
            ))}
          </VStack>
        )}
      </Box>
    </VStack>
  );
}

interface StoreDataPanelProps {
  storeType: "receivable" | "sendable" | "media" | null;
  defaultInjectData: string;
  onInject: (rawData: string) => void;
  sentDataLog: string[];
  onClearLog: () => void;
}

export function StoreDataPanel({
  storeType,
  defaultInjectData,
  onInject,
  sentDataLog,
  onClearLog,
}: StoreDataPanelProps) {
  return (
    <VStack gap={3} align="stretch">
      <HStack>
        <Text fontSize="sm" fontWeight="semibold">
          Store Interaction
        </Text>
        {storeType && (
          <Badge
            colorPalette={
              storeType === "receivable" ? "green" : storeType === "sendable" ? "blue" : "gray"
            }
            size="sm"
          >
            {storeType}
          </Badge>
        )}
      </HStack>

      {storeType === "receivable" && (
        <ReceivableDataPanel onInject={onInject} defaultData={defaultInjectData} />
      )}
      {storeType === "sendable" && (
        <SendableDataPanel sentDataLog={sentDataLog} onClearLog={onClearLog} />
      )}
      {storeType === "media" && (
        <Text fontSize="xs" color="gray.500">
          Media stores are not supported in the widget test page.
        </Text>
      )}
      {!storeType && (
        <Text fontSize="xs" color="gray.400">
          Apply a connector config to enable store interaction.
        </Text>
      )}
    </VStack>
  );
}