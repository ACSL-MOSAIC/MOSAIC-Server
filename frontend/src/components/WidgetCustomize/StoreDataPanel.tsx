import { Badge, Box, Button, Code, HStack, Input, Text, Textarea, VStack } from "@chakra-ui/react";
import { useState } from "react";

interface ReceivableDataPanelProps {
  onInject: (rawData: string) => void;
  defaultData: string;
}

function tryFormatJson(value: string): string {
  try {
    return JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    return value;
  }
}

function ReceivableDataPanel({ onInject, defaultData }: ReceivableDataPanelProps) {
  const [input, setInput] = useState(() => tryFormatJson(defaultData));

  return (
    <VStack gap={2} align="stretch">
      <Text fontSize="xs" color="gray.600">
        Inject raw data (simulates data arriving from the robot)
      </Text>
      <Textarea
        size="sm"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onBlur={(e) => setInput(tryFormatJson(e.target.value))}
        placeholder="Enter raw data string..."
        fontFamily="mono"
        rows={6}
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
  sentDataLog: { time: string; data: string }[];
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
        h="200px"
        overflow="auto"
        resize="vertical"
        bg="gray.50"
      >
        {sentDataLog.length === 0 ? (
          <Text fontSize="xs" color="gray.400">
            No data sent yet...
          </Text>
        ) : (
          <VStack gap={2} align="stretch">
            {sentDataLog.map((entry, i) => (
              <Box key={i}>
                <Text fontSize="xs" color="gray.400" mb="1px">
                  {entry.time}
                </Text>
                <Code fontSize="xs" whiteSpace="pre-wrap" wordBreak="break-all" display="block">
                  {tryFormatJson(entry.data)}
                </Code>
              </Box>
            ))}
          </VStack>
        )}
      </Box>
    </VStack>
  );
}

const SAMPLE_VIDEO_URL =
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";

interface MediaDataPanelProps {
  onInjectMedia: (url: string) => void;
}

function MediaDataPanel({ onInjectMedia }: MediaDataPanelProps) {
  const [url, setUrl] = useState(SAMPLE_VIDEO_URL);

  return (
    <VStack gap={2} align="stretch">
      <Text fontSize="xs" color="gray.600">
        Enter a video URL to simulate a media stream. The video will be captured and injected into
        the store. Note: CORS must be allowed on the video server.
      </Text>
      <Input
        size="sm"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://example.com/video.mp4"
        fontFamily="mono"
      />
      <HStack justify="flex-end">
        <Button size="sm" colorPalette="purple" onClick={() => onInjectMedia(url)}>
          Load Stream
        </Button>
      </HStack>
    </VStack>
  );
}

interface StoreDataPanelProps {
  storeType: "receivable" | "sendable" | "media" | null;
  defaultInjectData: string;
  onInject: (rawData: string) => void;
  onInjectMedia: (url: string) => void;
  sentDataLog: { time: string; data: string }[];
  onClearLog: () => void;
}

export function StoreDataPanel({
  storeType,
  defaultInjectData,
  onInject,
  onInjectMedia,
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
              storeType === "receivable" ? "green" : storeType === "sendable" ? "blue" : "purple"
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
      {storeType === "media" && <MediaDataPanel onInjectMedia={onInjectMedia} />}
      {!storeType && (
        <Text fontSize="xs" color="gray.400">
          Apply a connector config to enable store interaction.
        </Text>
      )}
    </VStack>
  );
}
