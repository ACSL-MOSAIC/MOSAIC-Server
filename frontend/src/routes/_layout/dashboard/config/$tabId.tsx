import {
  Box,
  Button,
  Container,
  HStack,
  Heading,
  Spinner,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

import {
  getTabConfigApi,
  getTabListApi,
  updateTabConfigApi,
} from "@/client/service/dashboard.api.ts";
import useAuth from "@/hooks/useAuth.ts";
import useCustomToast from "@/hooks/useCustomToast.ts";

export const Route = createFileRoute("/_layout/dashboard/config/$tabId")({
  component: TabConfigEditPage,
});

const DEFAULT_DASHBOARD_CONFIG = { widgets: [] };

const getDefaultConfigText = (): string => JSON.stringify(DEFAULT_DASHBOARD_CONFIG, null, 2);

const ensureDashboardConfig = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { ...DEFAULT_DASHBOARD_CONFIG };
  }
  const config = value as Record<string, unknown>;
  if (Array.isArray(config.widgets)) return config;
  return { ...config, widgets: [] };
};

const formatConfigForEditor = (jsonString: string): string => {
  try {
    const parsed = JSON.parse(jsonString);
    return JSON.stringify(ensureDashboardConfig(parsed), null, 2);
  } catch {
    return jsonString;
  }
};

const normalizeConfigForSave = (jsonString: string): string => {
  const parsed = JSON.parse(jsonString);
  return JSON.stringify(ensureDashboardConfig(parsed));
};

function TabConfigEditPage() {
  const { tabId } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showSuccessToast, showErrorToast } = useCustomToast();

  const [configText, setConfigText] = useState(getDefaultConfigText());
  const [savedConfigText, setSavedConfigText] = useState(getDefaultConfigText());

  const { data: tabs = [] } = useQuery({
    queryKey: ["dashboardTabs"],
    queryFn: getTabListApi,
    enabled: !!user,
  });

  const tab = tabs.find((t) => t.id === tabId);

  const { data: tabConfig, isLoading: isConfigLoading } = useQuery({
    queryKey: ["dashboardTabConfig", tabId],
    queryFn: () => getTabConfigApi(tabId),
    enabled: !!tabId,
  });

  useEffect(() => {
    if (!tabConfig) return;
    const rawConfig = typeof tabConfig.widgets === "string" ? tabConfig.widgets.trim() : "";
    const formatted =
      rawConfig.length > 0 ? formatConfigForEditor(rawConfig) : getDefaultConfigText();
    setConfigText(formatted);
    setSavedConfigText(formatted);
  }, [tabConfig]);

  const hasChanges = useMemo(() => configText !== savedConfigText, [configText, savedConfigText]);

  const jsonError = useMemo(() => {
    try {
      JSON.parse(configText);
      return "";
    } catch {
      return "Invalid JSON format";
    }
  }, [configText]);

  const saveConfigMutation = useMutation({
    mutationFn: async (rawConfig: string) => {
      const normalized = normalizeConfigForSave(rawConfig);
      await updateTabConfigApi(tabId, { tabConfig: normalized });
      return normalized;
    },
    onSuccess: (normalized) => {
      const formatted = formatConfigForEditor(normalized);
      setConfigText(formatted);
      setSavedConfigText(formatted);
      showSuccessToast("Dashboard config saved.");
      queryClient.invalidateQueries({ queryKey: ["dashboardTabConfig", tabId] });
      queryClient.invalidateQueries({ queryKey: ["parsedDashboardTabConfig", tabId] });
    },
    onError: () => {
      showErrorToast("Failed to save dashboard config.");
    },
  });

  const handleSave = () => {
    if (jsonError) {
      showErrorToast("JSON format is invalid.");
      return;
    }
    saveConfigMutation.mutate(configText);
  };

  const handleConnect = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    navigate({ to: "/dashboard/$tabId" as any, params: { tabId } as any });
  };

  if (!user) {
    return (
      <Container maxW="full" py={8}>
        <Heading size="lg">Please log in.</Heading>
      </Container>
    );
  }

  return (
    <Container maxW="4xl" py={4}>
      <VStack align="stretch" gap={4}>
        <HStack justify="space-between">
          <Box>
            <Text fontSize="sm" color="gray.500">
              Dashboard / Edit Tab
            </Text>
            <Heading size="lg">{tab?.name ?? tabId}</Heading>
          </Box>
          <HStack gap={2}>
            <Button variant="outline" onClick={() => navigate({ to: "/dashboard/config" })}>
              Back
            </Button>
            <Button colorPalette="blue" onClick={handleConnect}>
              Connect
            </Button>
          </HStack>
        </HStack>

        {isConfigLoading ? (
          <HStack gap={3}>
            <Spinner size="sm" />
            <Text>Loading tab configuration...</Text>
          </HStack>
        ) : (
          <VStack align="stretch" gap={2}>
            <HStack justify="space-between">
              <Text fontSize="sm" color="gray.600">
                Dashboard Config JSON
              </Text>
              <Text color={hasChanges ? "orange.500" : "green.600"} fontSize="sm">
                {hasChanges ? "Unsaved changes" : "Saved"}
              </Text>
            </HStack>
            <Textarea
              value={configText}
              onChange={(event) => setConfigText(event.target.value)}
              minH="400px"
              fontFamily="monospace"
              fontSize="sm"
            />
            {jsonError && (
              <Text color="red.500" fontSize="sm">
                {jsonError}
              </Text>
            )}
            <HStack justify="space-between">
              <Button
                variant="outline"
                onClick={() => setConfigText(savedConfigText)}
                disabled={!hasChanges}
              >
                Discard Changes
              </Button>
              <Button
                onClick={handleSave}
                loading={saveConfigMutation.isPending}
                disabled={!hasChanges || !!jsonError}
              >
                Save Config
              </Button>
            </HStack>
          </VStack>
        )}
      </VStack>
    </Container>
  );
}
