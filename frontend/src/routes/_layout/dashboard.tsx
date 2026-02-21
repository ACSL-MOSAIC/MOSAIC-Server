import {
  getTabConfigApi,
  getTabListApi,
  updateTabConfigApi,
} from "@/client/service/dashboard.api.ts"
import useCustomToast from "@/hooks/useCustomToast"
import useAuth from "@/hooks/useAuth"
import {
  Button,
  Container,
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
import {useEffect, useMemo, useState} from "react"

export const Route = createFileRoute("/_layout/dashboard")({
  component: DashboardPage,
})

const prettyJson = (jsonString: string): string => {
  try {
    return JSON.stringify(JSON.parse(jsonString), null, 2)
  } catch {
    return jsonString
  }
}

function DashboardPage() {
  const {user} = useAuth()
  const queryClient = useQueryClient()
  const {showSuccessToast, showErrorToast} = useCustomToast()

  const [selectedTabId, setSelectedTabId] = useState("")
  const [configText, setConfigText] = useState("")
  const [savedConfigText, setSavedConfigText] = useState("")

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
    const formatted = prettyJson(tabConfig.widgets)
    setConfigText(formatted)
    setSavedConfigText(formatted)
  }, [tabConfig])

  const hasChanges = useMemo(
    () => configText !== savedConfigText,
    [configText, savedConfigText],
  )

  const saveConfigMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTabId) {
        throw new Error("No tab selected")
      }
      const normalized = JSON.stringify(JSON.parse(configText))
      await updateTabConfigApi(selectedTabId, {tabConfig: normalized})
      return normalized
    },
    onSuccess: (normalizedConfig) => {
      const formatted = prettyJson(normalizedConfig)
      setConfigText(formatted)
      setSavedConfigText(formatted)
      showSuccessToast("Dashboard config saved.")
      queryClient.invalidateQueries({
        queryKey: ["dashboardTabConfig", selectedTabId],
      })
    },
    onError: () => {
      showErrorToast("Failed to save dashboard config or invalid JSON.")
    },
  })

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
        <Text>생성된 대시보드 탭이 없습니다.</Text>
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
        </HStack>

        {isConfigLoading ? (
          <HStack gap={3}>
            <Spinner size="sm"/>
            <Text>선택한 탭의 config를 불러오는 중입니다.</Text>
          </HStack>
        ) : (
          <Textarea
            value={configText}
            onChange={(event) => setConfigText(event.target.value)}
            minH="520px"
            fontFamily="monospace"
            fontSize="sm"
          />
        )}

        <HStack justify="flex-end">
          <Button
            onClick={() => saveConfigMutation.mutate()}
            loading={saveConfigMutation.isPending}
            disabled={!selectedTabId || !hasChanges}
          >
            Save Config
          </Button>
        </HStack>
      </VStack>
    </Container>
  )
}
