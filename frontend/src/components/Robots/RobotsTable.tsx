import {
  Box,
  EmptyState,
  Flex,
  Table,
  VStack,
} from "@chakra-ui/react"
import {useQuery} from "@tanstack/react-query"
import {useNavigate} from "@tanstack/react-router"
import {useState} from "react"
import {FiCopy, FiSearch} from "react-icons/fi"

import {readRobotsApi} from "@/client/service/robot.api.ts"
import {RobotActionsMenu} from "@/components/Common/RobotActionsMenu"
import PendingRobots from "@/components/Pending/PendingRobots"
import {
  PaginationItems,
  PaginationNextTrigger,
  PaginationPrevTrigger,
  PaginationRoot,
} from "@/components/ui/pagination.tsx"
import useCustomToast from "@/hooks/useCustomToast"
import {Route} from "@/routes/_layout/robots.tsx";
import {convertRobotStatusToString} from "@/utils/robot-status.ts";


const PER_PAGE = 5

function getRobotsQueryOptions({page}: { page: number }) {
  return {
    queryFn: () => readRobotsApi(PER_PAGE, (page - 1) * PER_PAGE),
    queryKey: ["robots", {page}],
  }
}

export function RobotsTable() {
  const navigate = useNavigate({from: Route.fullPath})
  const {page} = Route.useSearch()
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const {showSuccessToast} = useCustomToast()

  const {data, isLoading, isPlaceholderData} = useQuery({
    ...getRobotsQueryOptions({page}),
    placeholderData: (prevData) => prevData,
  })

  const setPage = (page: number) =>
    navigate({
      search: (prev: { [key: string]: string }) => ({...prev, page}),
    })

  const robots = data?.data.slice(0, PER_PAGE) ?? []
  const count = data?.count ?? 0

  const handleCopyId = async (id: string) => {
    try {
      await navigator.clipboard.writeText(id)
      showSuccessToast("ID copied to clipboard")
    } catch (err) {
      console.error("Failed to copy ID:", err)
    }
  }

  if (isLoading) {
    return <PendingRobots/>
  }

  if (robots.length === 0) {
    return (
      <EmptyState.Root>
        <EmptyState.Content>
          <EmptyState.Indicator>
            <FiSearch/>
          </EmptyState.Indicator>
          <VStack textAlign="center">
            <EmptyState.Title>You don't have any robots yet</EmptyState.Title>
            <EmptyState.Description>
              Add a new robot to get started
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
            <Table.ColumnHeader w="sm">Status</Table.ColumnHeader>
            <Table.ColumnHeader w="sm">Description</Table.ColumnHeader>
            <Table.ColumnHeader w="sm">Actions</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {robots?.map((robot) => (
            <Table.Row key={robot.id} opacity={isPlaceholderData ? 0.5 : 1}>
              <Table.Cell
                truncate
                maxW="sm"
                position="relative"
                onMouseEnter={() => setHoveredId(robot.id)}
                onMouseLeave={() => setHoveredId(null)}
                cursor="pointer"
                onClick={() => handleCopyId(robot.id)}
              >
                <Box display="flex" alignItems="center" gap={2}>
                  {robot.id}
                  {hoveredId === robot.id && <FiCopy size={14} opacity={0.7}/>}
                </Box>
              </Table.Cell>
              <Table.Cell truncate maxW="sm">
                {robot.name}
              </Table.Cell>
              <Table.Cell truncate maxW="sm">
                {convertRobotStatusToString(robot.status)}
              </Table.Cell>
              <Table.Cell
                color={!robot.description ? "gray" : "inherit"}
                truncate
                maxW="30%"
              >
                {robot.description || "N/A"}
              </Table.Cell>
              <Table.Cell>
                <RobotActionsMenu robot={robot}/>
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