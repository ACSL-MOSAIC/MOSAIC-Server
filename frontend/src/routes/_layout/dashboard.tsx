import {
  addTabApi,
  deleteTabApi,
  getTabConfigApi,
  getTabListApi,
  updateTabConfigApi,
  updateTabNameApi,
} from "@/client/service/dashboard.api.ts"
import useAuth from "@/hooks/useAuth"
import useCustomToast from "@/hooks/useCustomToast"
import {
  Badge,
  Box,
  Button,
  Container,
  HStack,
  Heading,
  Input,
  Spinner,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useEffect, useMemo, useState } from "react"

export const Route = createFileRoute("/_layout/dashboard")({
  component: DashboardPage,
})

const DEFAULT_DASHBOARD_CONFIG = { widgets: [] }

const getDefaultConfigText = (): string =>
  JSON.stringify(DEFAULT_DASHBOARD_CONFIG, null, 2)

const ensureDashboardConfig = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { ...DEFAULT_DASHBOARD_CONFIG }
  }

  const config = value as Record<string, unknown>
  if (Array.isArray(config.widgets)) {
    return config
  }

  return {
    ...config,
    widgets: [],
  }
}

const formatConfigForEditor = (jsonString: string): string => {
  try {
    const parsed = JSON.parse(jsonString)
    return JSON.stringify(ensureDashboardConfig(parsed), null, 2)
  } catch {
    return jsonString
  }
}

const normalizeConfigForSave = (jsonString: string): string => {
  const parsed = JSON.parse(jsonString)
  return JSON.stringify(ensureDashboardConfig(parsed))
}

function DashboardPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()

  const [selectedTabId, setSelectedTabId] = useState("")
  const [newTabName, setNewTabName] = useState("Dashboard")
  const [configText, setConfigText] = useState(getDefaultConfigText())
  const [savedConfigText, setSavedConfigText] = useState(getDefaultConfigText())

  const { data: tabs = [], isLoading: isTabsLoading } = useQuery({
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

  const { data: tabConfig, isLoading: isConfigLoading } = useQuery({
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
    const formattedConfig =
      rawConfig.length > 0
        ? formatConfigForEditor(rawConfig)
        : getDefaultConfigText()

    setConfigText(formattedConfig)
    setSavedConfigText(formattedConfig)
  }, [tabConfig])

  const hasChanges = useMemo(
    () => configText !== savedConfigText,
    [configText, savedConfigText],
  )

  const jsonError = useMemo(() => {
    try {
      JSON.parse(configText)
      return ""
    } catch {
      return "Invalid JSON format"
    }
  }, [configText])

  const createTabMutation = useMutation({
    mutationFn: async (name: string) => addTabApi({ name }),
    onSuccess: async (_result, createdName) => {
      showSuccessToast("Dashboard tab created.")
      const nextTabs = await queryClient.fetchQuery({
        queryKey: ["dashboardTabs"],
        queryFn: getTabListApi,
      })

      const createdTab = [...nextTabs]
        .reverse()
        .find((tab) => tab.name === createdName)

      if (createdTab) {
        setSelectedTabId(createdTab.id)
        try {
          await updateTabConfigApi(createdTab.id, {
            tabConfig: JSON.stringify(DEFAULT_DASHBOARD_CONFIG),
          })
          await queryClient.invalidateQueries({
            queryKey: ["dashboardTabConfig", createdTab.id],
          })
        } catch {
          showErrorToast("Default dashboard config initialization failed.")
        }
      }

      setNewTabName("Dashboard")
    },
    onError: () => {
      showErrorToast("Failed to create dashboard tab.")
    },
  })

  const renameTabMutation = useMutation({
    mutationFn: async ({ tabId, name }: { tabId: string; name: string }) => {
      await updateTabNameApi(tabId, { name })
      return { tabId, name }
    },
    onSuccess: async () => {
      showSuccessToast("Dashboard name updated.")
      await queryClient.invalidateQueries({ queryKey: ["dashboardTabs"] })
    },
    onError: () => {
      showErrorToast("Failed to update dashboard name.")
    },
  })

  const deleteTabMutation = useMutation({
    mutationFn: async (tabId: string) => deleteTabApi(tabId),
    onSuccess: async (_result, tabId) => {
      showSuccessToast("Dashboard tab deleted.")
      await queryClient.invalidateQueries({ queryKey: ["dashboardTabs"] })
      await queryClient.invalidateQueries({
        queryKey: ["dashboardTabConfig", tabId],
      })

      const nextTabs = await queryClient.fetchQuery({
        queryKey: ["dashboardTabs"],
        queryFn: getTabListApi,
      })

      if (nextTabs.length === 0) {
        setSelectedTabId("")
        setConfigText(getDefaultConfigText())
        setSavedConfigText(getDefaultConfigText())
        return
      }

      setSelectedTabId(nextTabs[0].id)
    },
    onError: () => {
      showErrorToast("Failed to delete dashboard tab.")
    },
  })

  const saveConfigMutation = useMutation({
    mutationFn: async ({
      tabId,
      rawConfig,
    }: {
      tabId: string
      rawConfig: string
    }) => {
      const normalized = normalizeConfigForSave(rawConfig)
      await updateTabConfigApi(tabId, { tabConfig: normalized })
      return { tabId, normalized }
    },
    onSuccess: ({ tabId, normalized }) => {
      const formattedConfig = formatConfigForEditor(normalized)
      if (tabId === selectedTabId) {
        setConfigText(formattedConfig)
        setSavedConfigText(formattedConfig)
      }
      showSuccessToast("Dashboard config saved.")
      queryClient.invalidateQueries({
        queryKey: ["dashboardTabConfig", tabId],
      })
    },
    onError: () => {
      showErrorToast("Failed to save dashboard config.")
    },
  })

  const handleAddTab = () => {
    const trimmedName = newTabName.trim()
    if (trimmedName.length === 0) {
      showErrorToast("Tab name is required.")
      return
    }
    createTabMutation.mutate(trimmedName)
  }

  const handleRenameTab = (tabId: string, currentName: string) => {
    const nextName = window.prompt(
      "새 대시보드 이름을 입력하세요.",
      currentName,
    )
    if (nextName === null) {
      return
    }

    const trimmedName = nextName.trim()
    if (trimmedName.length === 0) {
      showErrorToast("Tab name is required.")
      return
    }
    if (trimmedName === currentName) {
      return
    }

    renameTabMutation.mutate({
      tabId,
      name: trimmedName,
    })
  }

  const handleSaveConfig = () => {
    if (jsonError) {
      showErrorToast("JSON format is invalid.")
      return
    }
    if (!selectedTabId) {
      return
    }
    saveConfigMutation.mutate({
      tabId: selectedTabId,
      rawConfig: configText,
    })
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
          <Spinner size="sm" />
          <Text>대시보드 탭을 불러오는 중입니다.</Text>
        </HStack>
      </Container>
    )
  }

  return (
    <Container maxW="full" py={4}>
      <VStack align="stretch" gap={4}>
        <Heading size="lg">Dashboard Config</Heading>

        <Box borderWidth="1px" borderRadius="md" p={4}>
          <Text fontWeight="semibold" mb={2}>
            Add Dashboard
          </Text>
          <HStack gap={2}>
            <Input
              maxW="320px"
              value={newTabName}
              onChange={(event) => setNewTabName(event.target.value)}
              placeholder="New dashboard name"
            />
            <Button
              onClick={handleAddTab}
              loading={createTabMutation.isPending}
            >
              Add Tab
            </Button>
          </HStack>
        </Box>

        <Box borderWidth="1px" borderRadius="md" p={4}>
          <HStack justify="space-between" mb={3}>
            <Text fontWeight="semibold">Current Dashboards</Text>
            <Badge colorPalette="blue" variant="subtle">
              {tabs.length} tabs
            </Badge>
          </HStack>

          {tabs.length === 0 ? (
            <Text color="gray.500">생성된 대시보드 탭이 없습니다.</Text>
          ) : (
            <VStack align="stretch" gap={2}>
              {tabs.map((tab) => (
                <Box
                  key={tab.id}
                  borderWidth="1px"
                  borderRadius="md"
                  px={3}
                  py={2}
                  borderColor={
                    selectedTabId === tab.id ? "blue.400" : "gray.200"
                  }
                  bg={selectedTabId === tab.id ? "blue.50" : "white"}
                  cursor="pointer"
                  onClick={() => setSelectedTabId(tab.id)}
                >
                  <HStack justify="space-between">
                    <Text
                      fontWeight={
                        selectedTabId === tab.id ? "semibold" : "normal"
                      }
                    >
                      {tab.name}
                    </Text>
                    <HStack gap={2}>
                      {selectedTabId === tab.id && (
                        <Badge colorPalette="blue" variant="solid">
                          Selected
                        </Badge>
                      )}
                      <Button
                        size="xs"
                        colorPalette="green"
                        onClick={(event) => {
                          event.stopPropagation()
                          handleRenameTab(tab.id, tab.name)
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
                          event.stopPropagation()
                          deleteTabMutation.mutate(tab.id)
                        }}
                        loading={deleteTabMutation.isPending}
                      >
                        Delete
                      </Button>
                    </HStack>
                  </HStack>
                  <Text fontSize="xs" color="gray.500">
                    {tab.id}
                  </Text>
                </Box>
              ))}
            </VStack>
          )}
        </Box>

        {tabs.length > 0 && (
          <>
            {isConfigLoading ? (
              <HStack gap={3}>
                <Spinner size="sm" />
                <Text>선택한 탭의 config를 불러오는 중입니다.</Text>
              </HStack>
            ) : (
              <VStack align="stretch" gap={2}>
                <HStack justify="space-between">
                  <Text fontSize="sm" color="gray.600">
                    Dashboard Config JSON
                  </Text>
                  <Text
                    color={hasChanges ? "orange.500" : "green.600"}
                    fontSize="sm"
                  >
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
                disabled={
                  !selectedTabId ||
                  !hasChanges ||
                  isConfigLoading ||
                  !!jsonError
                }
              >
                Save Config
              </Button>
            </HStack>
          </>
        )}
      </VStack>
    </Container>
  )
}
