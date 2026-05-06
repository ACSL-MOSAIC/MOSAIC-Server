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
  VStack,
} from "@chakra-ui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { type Layout, Responsive, WidthProvider } from "react-grid-layout";
import { LuInfo } from "react-icons/lu";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

import {
  deleteTabApi,
  getTabConfigApi,
  getTabListApi,
  updateTabConfigApi,
  updateTabNameApi,
} from "@/client/service/dashboard.api.ts";
import { getRobotListApi } from "@/client/service/robot.api.ts";
import { Tooltip } from "@/components/ui/tooltip.tsx";
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

export const Route = createFileRoute("/_layout/dashboard/config/")({
  component: DashboardPage,
});

const ResponsiveGridLayout = WidthProvider(Responsive);

interface PreviewWidget {
  id: string;
  type: string;
  position: { x: number; y: number; w: number; h: number };
  connectors: { robotId: string; connectorId: string }[];
  params?: Record<string, unknown>;
}

interface RawWidget {
  id: string;
  type: string;
  position?: { x: number; y: number; w: number; h: number };
  connectors?: { robotId: string; connectorId: string }[];
  params?: Record<string, unknown>;
}

const mergeLayoutIntoWidgets = (
  widgets: PreviewWidget[],
  layout: Layout[],
): PreviewWidget[] => {
  const layoutById = new Map(layout.map((item) => [item.i, item]));
  let hasChanged = false;

  const nextWidgets = widgets.map((widget) => {
    const next = layoutById.get(widget.id);
    if (!next) return widget;
    if (
      widget.position.x === next.x &&
      widget.position.y === next.y &&
      widget.position.w === next.w &&
      widget.position.h === next.h
    ) {
      return widget;
    }
    hasChanged = true;
    return { ...widget, position: { x: next.x, y: next.y, w: next.w, h: next.h } };
  });

  return hasChanged ? nextWidgets : widgets;
};

function DashboardPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { showSuccessToast, showErrorToast } = useCustomToast();
  const navigate = useNavigate();

  const connectConfirmButtonRef = useRef<HTMLButtonElement | null>(null);
  const editableWidgetsRef = useRef<PreviewWidget[]>([]);
  const isLayoutDirtyRef = useRef(false);

  const [selectedTabId, setSelectedTabId] = useState("");
  const [connectTargetTab, setConnectTargetTab] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [editableWidgets, setEditableWidgets] = useState<PreviewWidget[]>([]);

  const { data: tabs = [], isLoading: isTabsLoading } = useQuery({
    queryKey: ["dashboardTabs"],
    queryFn: getTabListApi,
    enabled: !!user,
  });

  const { data: robotsPage } = useQuery({
    queryKey: ["robots"],
    queryFn: () => getRobotListApi(1000, 0),
    enabled: !!user,
  });

  const robotNameById = new Map(
    (robotsPage?.data ?? []).map((r) => [r.id, r.name]),
  );

  useEffect(() => {
    if (tabs.length === 0) {
      setSelectedTabId("");
      return;
    }
    if (tabs.some((tab) => tab.id === selectedTabId)) return;

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

  const { data: tabConfigDto, isLoading: isConfigLoading } = useQuery({
    queryKey: ["dashboardTabConfig", selectedTabId],
    queryFn: () => getTabConfigApi(selectedTabId),
    enabled: selectedTabId.length > 0,
  });

  useEffect(() => {
    if (!tabConfigDto) {
      setEditableWidgets([]);
      editableWidgetsRef.current = [];
      isLayoutDirtyRef.current = false;
      return;
    }
    try {
      const raw = typeof tabConfigDto.widgets === "string" ? tabConfigDto.widgets.trim() : "{}";
      const parsed = JSON.parse(raw || "{}") as { widgets?: RawWidget[] };
      const widgets: PreviewWidget[] = (parsed.widgets ?? []).map((w) => ({
        id: w.id,
        type: w.type,
        position: w.position ?? { x: 0, y: 0, w: 2, h: 2 },
        connectors: w.connectors ?? [],
        params: w.params,
      }));
      setEditableWidgets(widgets);
      editableWidgetsRef.current = widgets;
      isLayoutDirtyRef.current = false;
    } catch {
      setEditableWidgets([]);
      editableWidgetsRef.current = [];
    }
  }, [tabConfigDto]);

  const saveLayoutMutation = useMutation({
    mutationFn: async ({ tabId, widgets }: { tabId: string; widgets: PreviewWidget[] }) => {
      await updateTabConfigApi(tabId, { tabConfig: JSON.stringify({ widgets }) });
    },
    onSuccess: async (_, { tabId }) => {
      await queryClient.invalidateQueries({ queryKey: ["parsedDashboardTabConfig", tabId] });
      await queryClient.invalidateQueries({ queryKey: ["dashboardTabConfig", tabId] });
    },
    onError: () => {
      isLayoutDirtyRef.current = true;
      showErrorToast("Failed to save layout.");
    },
  });

  const renameTabMutation = useMutation({
    mutationFn: async ({ tabId, name }: { tabId: string; name: string }) => {
      await updateTabNameApi(tabId, { name });
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
      await queryClient.invalidateQueries({ queryKey: ["dashboardTabConfig", tabId] });

      const nextTabs = await queryClient.fetchQuery({
        queryKey: ["dashboardTabs"],
        queryFn: getTabListApi,
      });

      setSelectedTabId(nextTabs.length > 0 ? nextTabs[0].id : "");
    },
    onError: () => {
      showErrorToast("Failed to delete dashboard tab.");
    },
  });

  const handleRenameTab = (tabId: string, currentName: string) => {
    const nextName = window.prompt("Enter a new dashboard name.", currentName);
    if (nextName === null) return;
    const trimmedName = nextName.trim();
    if (trimmedName.length === 0) {
      showErrorToast("Tab name is required.");
      return;
    }
    if (trimmedName === currentName) return;
    renameTabMutation.mutate({ tabId, name: trimmedName });
  };

  const handleLayoutChange = (layout: Layout[]) => {
    const next = mergeLayoutIntoWidgets(editableWidgetsRef.current, layout);
    if (next === editableWidgetsRef.current) return;
    editableWidgetsRef.current = next;
    setEditableWidgets(next);
    isLayoutDirtyRef.current = true;
  };

  const handleLayoutCommit = (layout: Layout[]) => {
    if (!selectedTabId) return;
    const next = mergeLayoutIntoWidgets(editableWidgetsRef.current, layout);
    if (next !== editableWidgetsRef.current) {
      editableWidgetsRef.current = next;
      setEditableWidgets(next);
      isLayoutDirtyRef.current = true;
    }
    if (!isLayoutDirtyRef.current) return;
    isLayoutDirtyRef.current = false;
    saveLayoutMutation.mutate({ tabId: selectedTabId, widgets: next });
  };

  const handleConfirmConnect = () => {
    if (!connectTargetTab?.id) return;
    void navigate({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      to: "/dashboard/$tabId" as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      params: { tabId: connectTargetTab.id } as any,
    });
    setConnectTargetTab(null);
  };

  useEffect(() => {
    if (!connectTargetTab) return;
    const timerId = window.setTimeout(() => {
      connectConfirmButtonRef.current?.focus();
    }, 0);
    return () => window.clearTimeout(timerId);
  }, [connectTargetTab]);

  if (!user) {
    return (
      <Container maxW="full" py={8}>
        <Heading size="lg">Please log in.</Heading>
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
      <Container maxW="full" py={4} px={6}>
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
              <Grid templateColumns="repeat(4, 1fr)" gap={2}>
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
                      <Text
                        fontWeight={selectedTabId === tab.id ? "semibold" : "normal"}
                        truncate
                      >
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
                          colorPalette="teal"
                          onClick={(event) => {
                            event.stopPropagation();
                            void navigate({
                              // eslint-disable-next-line @typescript-eslint/no-explicit-any
                              to: "/dashboard/config/$tabId" as any,
                              // eslint-disable-next-line @typescript-eslint/no-explicit-any
                              params: { tabId: tab.id } as any,
                            });
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          size="xs"
                          colorPalette="green"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleRenameTab(tab.id, tab.name);
                          }}
                          loading={renameTabMutation.isPending}
                        >
                          Rename
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

          {selectedTabId && (
            <Box borderWidth="1px" borderRadius="md" p={4}>
              <Text fontWeight="semibold" mb={3}>
                Preview of {tabs.find((t) => t.id === selectedTabId)?.name ?? selectedTabId}
              </Text>
              {isConfigLoading ? (
                <HStack gap={3} p={4}>
                  <Spinner size="sm" />
                  <Text>Loading preview...</Text>
                </HStack>
              ) : editableWidgets.length === 0 ? (
                <HStack justify="center" align="center" h="160px">
                  <Text color="gray.400" fontSize="sm">
                    No widgets configured. Use the Edit button to add widgets.
                  </Text>
                </HStack>
              ) : (
                <ResponsiveGridLayout
                  className="layout"
                  layouts={{
                    lg: editableWidgets.map((w) => ({
                      i: w.id,
                      x: w.position.x,
                      y: w.position.y,
                      w: w.position.w,
                      h: w.position.h,
                      minW: 1,
                      minH: 1,
                    })),
                  }}
                  breakpoints={{ lg: 1500, md: 1245, sm: 960, xs: 600, xxs: 0 }}
                  cols={{ lg: 15, md: 12, sm: 8, xs: 6, xxs: 3 }}
                  rowHeight={80}
                  onLayoutChange={handleLayoutChange}
                  onDragStop={handleLayoutCommit}
                  onResizeStop={handleLayoutCommit}
                  isDraggable
                  isResizable
                >
                  {editableWidgets.map((widget) => {
                    const robotNames = [
                      ...new Set(widget.connectors.map((c) => robotNameById.get(c.robotId) ?? c.robotId)),
                    ];
                    return (
                      <Box
                        key={widget.id}
                        position="relative"
                        bg="gray.50"
                        border="1px solid"
                        borderColor="gray.200"
                        borderRadius="md"
                        height="100%"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        overflow="hidden"
                      >
                        <Tooltip
                          content={
                            <Box
                              as="pre"
                              fontSize="xs"
                              p={3}
                              maxW="400px"
                              maxH="300px"
                              overflow="auto"
                              whiteSpace="pre"
                            >
                              {JSON.stringify(widget, null, 2)}
                            </Box>
                          }
                          interactive
                          closeOnScroll={false}
                          openDelay={100}
                          positioning={{ placement: "top" }}
                        >
                          <Box
                            position="absolute"
                            top={1}
                            right={1}
                            color="gray.400"
                            cursor="default"
                            _hover={{ color: "gray.600" }}
                            lineHeight={1}
                          >
                            <LuInfo size={13} />
                          </Box>
                        </Tooltip>
                        <VStack gap={0.5} px={2}>
                          <Text
                            fontSize="xs"
                            fontWeight="semibold"
                            color="gray.600"
                            textAlign="center"
                          >
                            {widget.type}
                          </Text>
                          {robotNames.length > 0 && (
                            <Text fontSize="xs" color="gray.400" textAlign="center">
                              {robotNames.join(", ")}
                            </Text>
                          )}
                        </VStack>
                      </Box>
                    );
                  })}
                </ResponsiveGridLayout>
              )}
            </Box>
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
            if (event.key !== "Enter") return;
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