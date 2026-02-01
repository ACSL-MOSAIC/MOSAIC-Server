import {
  Box,
  Button,
  EmptyState,
  Flex,
  HStack,
  Table,
  VStack,
} from "@chakra-ui/react"
import {useQuery} from "@tanstack/react-query"
import {useNavigate} from "@tanstack/react-router"
import {useState} from "react"
import {FiCopy, FiDownload, FiSearch} from "react-icons/fi"

import {
  downloadOccupancyMapApi,
  getOccupancyMapsListApi,
} from "@/client/service/occupancy-map.api.ts"
import DeleteOccupancyMap from "@/components/OccupancyMaps/DeleteOccupancyMap"
import PreviewOccupancyMap from "@/components/OccupancyMaps/PreviewOccupancyMap"
import {
  PaginationItems,
  PaginationNextTrigger,
  PaginationPrevTrigger,
  PaginationRoot,
} from "@/components/ui/pagination.tsx"
import useCustomToast from "@/hooks/useCustomToast"
import {Route} from "@/routes/_layout/occupancy-maps.tsx";

const PER_PAGE = 5

function getOccupancyMapsQueryOptions({page}: { page: number }) {
  return {
    queryFn: () => getOccupancyMapsListApi((page - 1) * PER_PAGE, PER_PAGE),
    queryKey: ["occupancy-maps", {page}],
  }
}

export function OccupancyMapsTable() {
  const navigate = useNavigate({from: Route.fullPath})
  const {page} = Route.useSearch()
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const {showSuccessToast, showErrorToast} = useCustomToast()

  const {data, isLoading, isPlaceholderData} = useQuery({
    ...getOccupancyMapsQueryOptions({page}),
    placeholderData: (prevData) => prevData,
  })

  const setPage = (page: number) =>
    navigate({
      search: (prev: { [key: string]: string }) => ({...prev, page}),
    })

  const occupancyMaps = data?.data.slice(0, PER_PAGE) ?? []
  const count = data?.count ?? 0

  const handleCopyId = async (id: string) => {
    try {
      await navigator.clipboard.writeText(id)
      showSuccessToast("ID copied to clipboard")
    } catch (err) {
      console.error("Failed to copy ID:", err)
    }
  }

  const handleDownload = async (id: string, name: string) => {
    try {
      const blob = await downloadOccupancyMapApi(id)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `${name}.zip`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      showSuccessToast("Download started")
    } catch (err) {
      console.error("Failed to download:", err)
      showErrorToast("Failed to download occupancy map")
    }
  }

  if (isLoading) {
    return (
      <EmptyState.Root>
        <EmptyState.Content>
          <VStack textAlign="center">
            <EmptyState.Title>Loading...</EmptyState.Title>
          </VStack>
        </EmptyState.Content>
      </EmptyState.Root>
    )
  }

  if (occupancyMaps.length === 0) {
    return (
      <EmptyState.Root>
        <EmptyState.Content>
          <EmptyState.Indicator>
            <FiSearch/>
          </EmptyState.Indicator>
          <VStack textAlign="center">
            <EmptyState.Title>
              You don't have any occupancy maps yet
            </EmptyState.Title>
            <EmptyState.Description>
              Add a new occupancy map to get started
            </EmptyState.Description>
          </VStack>
        </EmptyState.Content>
      </EmptyState.Root>
    )
  }

  return (
    <>
      <Table.Root size={{base: "sm", md: "md"}}>
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader w="sm">ID</Table.ColumnHeader>
            <Table.ColumnHeader w="sm">Name</Table.ColumnHeader>
            <Table.ColumnHeader w="sm">Created At</Table.ColumnHeader>
            <Table.ColumnHeader w="sm">Updated At</Table.ColumnHeader>
            <Table.ColumnHeader w="sm">Preview</Table.ColumnHeader>
            <Table.ColumnHeader w="sm">Actions</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {occupancyMaps?.map((occupancyMap) => (
            <Table.Row
              key={occupancyMap.id}
              opacity={isPlaceholderData ? 0.5 : 1}
            >
              <Table.Cell
                truncate
                maxW="sm"
                position="relative"
                onMouseEnter={() => setHoveredId(occupancyMap.id)}
                onMouseLeave={() => setHoveredId(null)}
                cursor="pointer"
                onClick={() => handleCopyId(occupancyMap.id)}
              >
                <Box display="flex" alignItems="center" gap={2}>
                  {occupancyMap.id}
                  {hoveredId === occupancyMap.id && (
                    <FiCopy size={14} opacity={0.7}/>
                  )}
                </Box>
              </Table.Cell>
              <Table.Cell truncate maxW="sm">
                {occupancyMap.name}
              </Table.Cell>
              <Table.Cell truncate maxW="sm">
                {new Date(occupancyMap.createdAt).toLocaleString()}
              </Table.Cell>
              <Table.Cell truncate maxW="sm">
                {new Date(occupancyMap.updatedAt).toLocaleString()}
              </Table.Cell>
              <Table.Cell>
                <PreviewOccupancyMap occupancyMap={occupancyMap}/>
              </Table.Cell>
              <Table.Cell>
                <HStack gap={2}>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      handleDownload(occupancyMap.id, occupancyMap.name)
                    }
                  >
                    <FiDownload/>
                  </Button>
                  <DeleteOccupancyMap id={occupancyMap.id}/>
                </HStack>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
      <Flex justifyContent="flex-end" mt={4}>
        <PaginationRoot
          count={count}
          pageSize={PER_PAGE}
          onPageChange={({page}) => setPage(page)}
        >
          <Flex>
            <PaginationPrevTrigger/>
            <PaginationItems/>
            <PaginationNextTrigger/>
          </Flex>
        </PaginationRoot>
      </Flex>
    </>
  )
}
