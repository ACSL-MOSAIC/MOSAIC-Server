import {
  addTabApi,
  getTabConfigApi,
  getTabListApi,
  updateTabConfigApi,
} from "@/client/service/dashboard.api.ts"
import useCustomToast from "@/hooks/useCustomToast"
import useAuth from "@/hooks/useAuth"
import {
  Badge,
  Box,
  Button,
  Container,
  Flex,
  Heading,
  HStack,
  NativeSelectField,
  NativeSelectRoot,
  Spinner,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react"
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query"
import {createFileRoute} from "@tanstack/react-router"
import {useEffect, useMemo, useRef, useState} from "react"

export const Route = createFileRoute("/_layout/dashboard")({
  component: DashboardPage,
})

type DashboardWidget = {
  id: string
  type: string
  position: {
    x: number
    y: number
    w: number
    h: number
  }
  connectors: unknown[]
}

type DashboardConfig = {
  widgets: DashboardWidget[]
  [key: string]: unknown
}

const DEFAULT_WIDGET_POSITION = {
  x: 0,
  y: 0,
  w: 4,
  h: 4,
}

const DEFAULT_TAB_CONFIG: DashboardConfig = {
  widgets: [],
}

const INITIAL_WIDGET_TYPES = ["osm_gps_map", "video_stream"] as const

const normalizeDashboardConfig = (rawConfig: string): DashboardConfig => {
  try {
    const parsed = JSON.parse(rawConfig)
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return DEFAULT_TAB_CONFIG
    }

    const parsedObject = parsed as Record<string, unknown>
    const parsedWidgets = Array.isArray(parsedObject.widgets)
      ? parsedObject.widgets
      : []

    const widgets = parsedWidgets.map((widget, index) => {
      const widgetObject =
        widget && typeof widget === "object"
          ? (widget as Record<string, unknown>)
          : {}
      return {
        id:
          typeof widgetObject.id === "string" && widgetObject.id.length > 0
            ? widgetObject.id
            : `widget-${index + 1}`,
        type:
          typeof widgetObject.type === "string" && widgetObject.type.length > 0
            ? widgetObject.type
            : "unknown_widget",
        position:
          widgetObject.position &&
          typeof widgetObject.position === "object" &&
          !Array.isArray(widgetObject.position)
            ? ({
                x:
                  typeof (widgetObject.position as Record<string, unknown>).x ===
                  "number"
                    ? ((widgetObject.position as Record<string, unknown>)
                        .x as number)
                    : DEFAULT_WIDGET_POSITION.x,
                y:
                  typeof (widgetObject.position as Record<string, unknown>).y ===
                  "number"
                    ? ((widgetObject.position as Record<string, unknown>)
                        .y as number)
                    : DEFAULT_WIDGET_POSITION.y,
                w:
                  typeof (widgetObject.position as Record<string, unknown>).w ===
                  "number"
                    ? ((widgetObject.position as Record<string, unknown>)
                        .w as number)
                    : DEFAULT_WIDGET_POSITION.w,
                h:
                  typeof (widgetObject.position as Record<string, unknown>).h ===
                  "number"
                    ? ((widgetObject.position as Record<string, unknown>)
                        .h as number)
                    : DEFAULT_WIDGET_POSITION.h,
              } as DashboardWidget["position"])
            : DEFAULT_WIDGET_POSITION,
        connectors: Array.isArray(widgetObject.connectors)
          ? widgetObject.connectors
          : [],
      }
    })

    return {
      ...parsedObject,
      widgets,
    } as DashboardConfig
  } catch {
    return DEFAULT_TAB_CONFIG
  }
}

function DashboardPage() {
  const {user} = useAuth()
  const queryClient = useQueryClient()
  const {showSuccessToast, showErrorToast} = useCustomToast()

  const [selectedTabId, setSelectedTabId] = useState("")
  const [draftConfig, setDraftConfig] = useState<DashboardConfig>(
    DEFAULT_TAB_CONFIG,
  )
  const [savedConfig, setSavedConfig] = useState<DashboardConfig>(
    DEFAULT_TAB_CONFIG,
  )
  const [newWidgetType, setNewWidgetType] = useState<string>(
    INITIAL_WIDGET_TYPES[0],
  )
  const autoInitializedTabsRef = useRef<Set<string>>(new Set())

  const {data: tabs = [], isLoading: isTabsLoading} = useQuery({
    queryKey: ["dashboardTabs"],
    queryFn: getTabListApi,
    enabled: !!user,
  })

  useEffect(() => {
    if (tabs.length === 0) {
      setSelectedTabId("")
      return
    }

    const hasSelectedTab = tabs.some((tab) => tab.id === selectedTabId)
    if (!hasSelectedTab) {
      setSelectedTabId(tabs[0].id)
    }
  }, [tabs, selectedTabId])

  const {data: tabConfig, isLoading: isConfigLoading} = useQuery({
    queryKey: ["dashboardTabConfig", selectedTabId],
    queryFn: () => getTabConfigApi(selectedTabId),
    enabled: selectedTabId.length > 0,
  })

  useEffect(() => {
    if (!tabConfig) {
      return
    }
    const rawConfig =
      typeof tabConfig.widgets === "string" ? tabConfig.widgets.trim() : ""
    const normalized =
      rawConfig.length > 0
        ? normalizeDashboardConfig(rawConfig)
        : DEFAULT_TAB_CONFIG
    setDraftConfig(normalized)
    setSavedConfig(normalized)
  }, [tabConfig])

  const hasChanges = useMemo(
    () => JSON.stringify(draftConfig) !== JSON.stringify(savedConfig),
    [draftConfig, savedConfig],
  )
  const widgetCount = draftConfig.widgets.length
  const configPreview = useMemo(
    () => JSON.stringify(draftConfig, null, 2),
    [draftConfig],
  )

  const saveConfigMutation = useMutation({
    mutationFn: async ({
      tabId,
      config,
      silent,
    }: {
      tabId: string
      config: DashboardConfig
      silent?: boolean
    }) => {
      const serialized = JSON.stringify(config)
      await updateTabConfigApi(tabId, {tabConfig: serialized})
      return {tabId, config, silent}
    },
    onSuccess: ({tabId, config, silent}) => {
      if (tabId === selectedTabId) {
        setSavedConfig(config)
      }
      if (!silent) {
        showSuccessToast("Dashboard config saved.")
      }
      queryClient.invalidateQueries({
        queryKey: ["dashboardTabConfig", tabId],
      })
    },
    onError: (_error, variables) => {
      if (variables.silent) {
        autoInitializedTabsRef.current.delete(variables.tabId)
      }
      showErrorToast("Failed to save dashboard config.")
    },
  })

  const createDefaultTabMutation = useMutation({
    mutationFn: async () => addTabApi({name: "Dashboard"}),
    onSuccess: async () => {
      showSuccessToast("Default dashboard tab created.")
      await queryClient.invalidateQueries({queryKey: ["dashboardTabs"]})
    },
    onError: () => {
      showErrorToast("Failed to create default tab.")
    },
  })

  useEffect(() => {
    if (!tabConfig || !selectedTabId) {
      return
    }
    const rawConfig =
      typeof tabConfig.widgets === "string" ? tabConfig.widgets.trim() : ""
    const needsInitialization = rawConfig.length === 0
    if (!needsInitialization) {
      return
    }
    if (autoInitializedTabsRef.current.has(selectedTabId)) {
      return
    }

    autoInitializedTabsRef.current.add(selectedTabId)
    saveConfigMutation.mutate({
      tabId: selectedTabId,
      config: DEFAULT_TAB_CONFIG,
      silent: true,
    })
  }, [selectedTabId, tabConfig, saveConfigMutation])

  const handleAddWidget = () => {
    if (!newWidgetType) {
      return
    }
    const newWidget: DashboardWidget = {
      id: crypto.randomUUID(),
      type: newWidgetType,
      position: DEFAULT_WIDGET_POSITION,
      connectors: [],
    }
    setDraftConfig((prev) => ({
      ...prev,
      widgets: [...prev.widgets, newWidget],
    }))
  }

  const handleDeleteWidget = (widgetId: string) => {
    setDraftConfig((prev) => ({
      ...prev,
      widgets: prev.widgets.filter((widget) => widget.id !== widgetId),
    }))
  }

  if (!user) {
    return (
      <Container maxW="full" py={8}>
        <Heading size="lg" mb={8}>
          로그인이 필요합니다.
        </Heading>
      </Container>
    )
  }

  if (isTabsLoading) {
    return (
      <Container maxW="full" py={8}>
        <HStack gap={3}>
          <Spinner size="sm"/>
          <Text>대시보드 탭을 불러오는 중입니다.</Text>
        </HStack>
      </Container>
    )
  }

  if (tabs.length === 0) {
    return (
      <Container maxW="full" py={8}>
        <Heading size="lg" mb={3}>
          Dashboard Config
        </Heading>
        <Text mb={4}>생성된 대시보드 탭이 없습니다.</Text>
        <Button
          w="fit-content"
          onClick={() => createDefaultTabMutation.mutate()}
          loading={createDefaultTabMutation.isPending}
        >
          Create Default Tab
        </Button>
      </Container>
    )
  }

  return (
    <Container maxW="full" py={4}>
      <VStack align="stretch" gap={4}>
        <Heading size="lg">Dashboard Config</Heading>

        <HStack gap={3}>
          <Text minW="64px">Tab</Text>
          <NativeSelectRoot maxW="360px">
            <NativeSelectField
              value={selectedTabId}
              onChange={(event) => setSelectedTabId(event.target.value)}
            >
              {tabs.map((tab) => (
                <option key={tab.id} value={tab.id}>
                  {tab.name}
                </option>
              ))}
            </NativeSelectField>
          </NativeSelectRoot>
          <Text color={hasChanges ? "orange.500" : "green.600"} fontSize="sm" ml={2}>
            {hasChanges ? "Unsaved changes" : "Saved"}
          </Text>
        </HStack>

        {isConfigLoading ? (
          <HStack gap={3}>
            <Spinner size="sm"/>
            <Text>선택한 탭의 config를 불러오는 중입니다.</Text>
          </HStack>
        ) : (
          <>
            <Flex justify="space-between" align="center">
              <HStack gap={2}>
                <NativeSelectRoot maxW="240px">
                  <NativeSelectField
                    value={newWidgetType}
                    onChange={(event) => setNewWidgetType(event.target.value)}
                  >
                    {INITIAL_WIDGET_TYPES.map((widgetType) => (
                      <option key={widgetType} value={widgetType}>
                        {widgetType}
                      </option>
                    ))}
                  </NativeSelectField>
                </NativeSelectRoot>
                <Button onClick={handleAddWidget}>Add Widget</Button>
              </HStack>
              <Badge colorPalette="blue" variant="subtle">
                Widgets: {widgetCount}
              </Badge>
            </Flex>

            <VStack align="stretch" gap={2}>
              {draftConfig.widgets.length === 0 ? (
                <Box
                  borderWidth="1px"
                  borderRadius="md"
                  px={4}
                  py={6}
                  color="gray.500"
                >
                  No widgets yet. Add one to build the dashboard config.
                </Box>
              ) : (
                draftConfig.widgets.map((widget) => (
                  <HStack
                    key={widget.id}
                    justify="space-between"
                    borderWidth="1px"
                    borderRadius="md"
                    px={3}
                    py={2}
                  >
                    <VStack align="start" gap={0}>
                      <Text fontSize="sm" fontWeight="medium">
                        {widget.type}
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        {widget.id}
                      </Text>
                    </VStack>
                    <Button
                      size="xs"
                      variant="outline"
                      colorPalette="red"
                      onClick={() => handleDeleteWidget(widget.id)}
                    >
                      Delete
                    </Button>
                  </HStack>
                ))
              )}
            </VStack>

            <Box>
              <Text fontSize="sm" color="gray.600" mb={2}>
                Config JSON Preview (read-only)
              </Text>
              <Textarea
                value={configPreview}
                readOnly
                minH="280px"
                fontFamily="monospace"
                fontSize="sm"
              />
            </Box>
          </>
        )}

        <HStack justify="space-between">
          <Button
            variant="outline"
            onClick={() => setDraftConfig(savedConfig)}
            disabled={!hasChanges}
          >
            Discard Changes
          </Button>
          <Button
            onClick={() =>
              saveConfigMutation.mutate({
                tabId: selectedTabId,
                config: draftConfig,
              })
            }
            loading={saveConfigMutation.isPending}
            disabled={!selectedTabId || !hasChanges || isConfigLoading}
          >
            Save Config
          </Button>
        </HStack>
      </VStack>
    </Container>
  )
}
