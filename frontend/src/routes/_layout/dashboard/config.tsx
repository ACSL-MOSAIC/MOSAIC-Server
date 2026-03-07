import {
  Badge,
  Box,
  Button,
  Container,
  Grid,
  HStack,
  Heading,
  Spinner,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  deleteTabApi,
  getTabConfigApi,
  getTabListApi,
  updateTabConfigApi,
  updateTabNameApi,
} from "@/client/service/dashboard.api.ts";
import AddDashboardDialog from "@/components/Dashboard/AddDashboardDialog.tsx";
import {
  DialogActionTrigger,
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTitle,
} from "@/components/ui/dialog.tsx";
import useAuth from "@/hooks/useAuth.ts";
import useCustomToast from "@/hooks/useCustomToast.ts";
import { DASHBOARD_STORAGE_KEYS } from "@/utils";

export const Route = createFileRoute("/_layout/dashboard/config")({
  component: DashboardPage,
});

const DEFAULT_DASHBOARD_CONFIG = { widgets: [] };

const getDefaultConfigText = (): string => JSON.stringify(DEFAULT_DASHBOARD_CONFIG, null, 2);

const ensureDashboardConfig = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { ...DEFAULT_DASHBOARD_CONFIG };
  }

  const config = value as Record<string, unknown>;
  if (Array.isArray(config.widgets)) {
    return config;
  }

  return {
    ...config,
    widgets: [],
  };
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

function DashboardPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { showSuccessToast, showErrorToast } = useCustomToast();

  const navigate = useNavigate();
  const connectConfirmButtonRef = useRef<HTMLButtonElement | null>(null);
  const [selectedTabId, setSelectedTabId] = useState("");
  const [connectTargetTab, setConnectTargetTab] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [configText, setConfigText] = useState(getDefaultConfigText());
  const [savedConfigText, setSavedConfigText] = useState(getDefaultConfigText());

  const { data: tabs = [], isLoading: isTabsLoading } = useQuery({
    queryKey: ["dashboardTabs"],
    queryFn: getTabListApi,
    enabled: !!user,
  });

  useEffect(() => {
    if (tabs.length === 0) {
      setSelectedTabId("");
      return;
    }

    const hasSelectedTab = tabs.some((tab) => tab.id === selectedTabId);
    if (hasSelectedTab) {
      return;
    }

    const savedTabId =
      typeof window === "undefined"
        ? null
        : window.localStorage.getItem(DASHBOARD_STORAGE_KEYS.lastTabId);
    if (savedTabId && tabs.some((tab) => tab.id === savedTabId)) {
      setSelectedTabId(savedTabId);
      return;
    }

    setSelectedTabId(tabs[0].id);
  }, [tabs, selectedTabId]);

  const { data: tabConfig, isLoading: isConfigLoading } = useQuery({
    queryKey: ["dashboardTabConfig", selectedTabId],
    queryFn: () => getTabConfigApi(selectedTabId),
    enabled: selectedTabId.length > 0,
  });

  useEffect(() => {
    if (!tabConfig) {
      return;
    }

    const rawConfig = typeof tabConfig.widgets === "string" ? tabConfig.widgets.trim() : "";
    const formattedConfig =
      rawConfig.length > 0 ? formatConfigForEditor(rawConfig) : getDefaultConfigText();

    setConfigText(formattedConfig);
    setSavedConfigText(formattedConfig);
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

  const renameTabMutation = useMutation({
    mutationFn: async ({ tabId, name }: { tabId: string; name: string }) => {
      await updateTabNameApi(tabId, { name });
      return { tabId, name };
    },
    onSuccess: async () => {
      showSuccessToast("Dashboard name updated.");
      await queryClient.invalidateQueries({ queryKey: ["dashboardTabs"] });
    },
    onError: () => {
      showErrorToast("Failed to update dashboard name.");
    },
  });

  const deleteTabMutation = useMutation({
    mutationFn: async (tabId: string) => deleteTabApi(tabId),
    onSuccess: async (_result, tabId) => {
      showSuccessToast("Dashboard tab deleted.");
      await queryClient.invalidateQueries({ queryKey: ["dashboardTabs"] });
      await queryClient.invalidateQueries({
        queryKey: ["dashboardTabConfig", tabId],
      });

      const nextTabs = await queryClient.fetchQuery({
        queryKey: ["dashboardTabs"],
        queryFn: getTabListApi,
      });

      if (nextTabs.length === 0) {
        setSelectedTabId("");
        setConfigText(getDefaultConfigText());
        setSavedConfigText(getDefaultConfigText());
        return;
      }

      setSelectedTabId(nextTabs[0].id);
    },
    onError: () => {
      showErrorToast("Failed to delete dashboard tab.");
    },
  });

  const saveConfigMutation = useMutation({
    mutationFn: async ({ tabId, rawConfig }: { tabId: string; rawConfig: string }) => {
      const normalized = normalizeConfigForSave(rawConfig);
      await updateTabConfigApi(tabId, { tabConfig: normalized });
      return { tabId, normalized };
    },
    onSuccess: ({ tabId, normalized }) => {
      const formattedConfig = formatConfigForEditor(normalized);
      if (tabId === selectedTabId) {
        setConfigText(formattedConfig);
        setSavedConfigText(formattedConfig);
      }
      showSuccessToast("Dashboard config saved.");
      queryClient.invalidateQueries({
        queryKey: ["dashboardTabConfig", tabId],
      });
    },
    onError: () => {
      showErrorToast("Failed to save dashboard config.");
    },
  });

  const handleRenameTab = (tabId: string, currentName: string) => {
    const nextName = window.prompt("Enter a new dashboard name.", currentName);
    if (nextName === null) {
      return;
    }

    const trimmedName = nextName.trim();
    if (trimmedName.length === 0) {
      showErrorToast("Tab name is required.");
      return;
    }
    if (trimmedName === currentName) {
      return;
    }

    renameTabMutation.mutate({
      tabId,
      name: trimmedName,
    });
  };

  const handleSaveConfig = () => {
    if (jsonError) {
      showErrorToast("JSON format is invalid.");
      return;
    }
    if (!selectedTabId) {
      return;
    }
    saveConfigMutation.mutate({
      tabId: selectedTabId,
      rawConfig: configText,
    });
  };

  const handleConfirmConnect = () => {
    if (!connectTargetTab?.id) {
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    navigate({
      to: "/dashboard/$tabId" as any,
      params: { tabId: connectTargetTab.id } as any,
    });
    setConnectTargetTab(null);
  };

  useEffect(() => {
    if (!connectTargetTab) {
      return;
    }
    const timerId = window.setTimeout(() => {
      connectConfirmButtonRef.current?.focus();
    }, 0);
    return () => {
      window.clearTimeout(timerId);
    };
  }, [connectTargetTab]);

  if (!user) {
    return (
      <Container maxW="full" py={8}>
        <Heading size="lg" mb={8}>
          Please log in.
        </Heading>
      </Container>
    );
  }

  if (isTabsLoading) {
    return (
      <Container maxW="full" py={8}>
        <HStack gap={3}>
          <Spinner size="sm" />
          <Text>Loading dashboard tabs...</Text>
        </HStack>
      </Container>
    );
  }

  return (
    <>
      <Container maxW="4xl" py={4}>
        <VStack align="stretch" gap={4}>
          <Heading size="lg">Dashboard Config</Heading>

          <Box borderWidth="1px" borderRadius="md" p={4}>
            <HStack justify="space-between" mb={3}>
              <Text fontWeight="semibold">Current Dashboards</Text>
              <HStack gap={2}>
                <Badge colorPalette="blue" variant="subtle">
                  {tabs.length} tabs
                </Badge>
                <AddDashboardDialog onCreated={setSelectedTabId} />
              </HStack>
            </HStack>

            {tabs.length === 0 ? (
              <Text color="gray.500">No dashboard tabs have been created.</Text>
            ) : (
              <Grid templateColumns="repeat(3, 1fr)" gap={2}>
                {tabs.map((tab) => (
                  <Box
                    key={tab.id}
                    borderWidth="1px"
                    borderRadius="md"
                    px={3}
                    py={2}
                    borderColor={selectedTabId === tab.id ? "blue.400" : "gray.200"}
                    bg={selectedTabId === tab.id ? "blue.50" : "white"}
                    cursor="pointer"
                    onClick={() => setSelectedTabId(tab.id)}
                  >
                    <HStack justify="space-between" mb={1}>
                      <Text fontWeight={selectedTabId === tab.id ? "semibold" : "normal"} truncate>
                        {tab.name}
                      </Text>
                      {selectedTabId === tab.id && (
                        <Badge colorPalette="blue" variant="solid" flexShrink={0}>
                          Selected
                        </Badge>
                      )}
                    </HStack>
                    <HStack justify="space-between">
                      <Button
                        size="xs"
                        colorPalette="blue"
                        onClick={(event) => {
                          event.stopPropagation();
                          setConnectTargetTab({ id: tab.id, name: tab.name });
                        }}
                      >
                        Connect
                      </Button>
                      <HStack gap={2}>
                        <Button
                          size="xs"
                          colorPalette="green"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleRenameTab(tab.id, tab.name);
                          }}
                          loading={renameTabMutation.isPending}
                        >
                          Edit
                        </Button>
                        <Button
                          size="xs"
                          variant="outline"
                          colorPalette="red"
                          onClick={(event) => {
                            event.stopPropagation();
                            deleteTabMutation.mutate(tab.id);
                          }}
                          loading={deleteTabMutation.isPending}
                        >
                          Delete
                        </Button>
                      </HStack>
                    </HStack>
                  </Box>
                ))}
              </Grid>
            )}
          </Box>

          {tabs.length > 0 && (
            <>
              {isConfigLoading ? (
                <HStack gap={3}>
                  <Spinner size="sm" />
                  <Text>Loading the selected tab configuration...</Text>
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
                    minH="360px"
                    fontFamily="monospace"
                    fontSize="sm"
                  />
                  {jsonError && (
                    <Text color="red.500" fontSize="sm">
                      {jsonError}
                    </Text>
                  )}
                </VStack>
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
                  onClick={handleSaveConfig}
                  loading={saveConfigMutation.isPending}
                  disabled={!selectedTabId || !hasChanges || isConfigLoading || !!jsonError}
                >
                  Save Config
                </Button>
              </HStack>
            </>
          )}
        </VStack>
      </Container>

      <DialogRoot
        open={connectTargetTab !== null}
        onOpenChange={({ open }) => {
          if (!open) setConnectTargetTab(null);
        }}
        placement="center"
        size="sm"
      >
        <DialogContent
          onKeyDown={(event) => {
            if (event.key !== "Enter") {
              return;
            }
            event.preventDefault();
            handleConfirmConnect();
          }}
        >
          <DialogHeader>
            <DialogTitle>Connect to Dashboard</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <Text>
              Do you want to connect to the{" "}
              <Text as="span" fontWeight="semibold">
                {connectTargetTab?.name}
              </Text>{" "}
              dashboard?
            </Text>
          </DialogBody>
          <DialogFooter gap={2}>
            <DialogActionTrigger asChild>
              <Button variant="subtle" colorPalette="gray">
                Cancel
              </Button>
            </DialogActionTrigger>
            <Button
              ref={connectConfirmButtonRef}
              colorPalette="blue"
              autoFocus
              onClick={handleConfirmConnect}
            >
              Connect
            </Button>
          </DialogFooter>
          <DialogCloseTrigger />
        </DialogContent>
      </DialogRoot>
    </>
  );
}
