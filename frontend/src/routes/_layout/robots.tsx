import {
  Container,
  EmptyState,
  Flex,
  Heading,
  Table,
  VStack,
} from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { FiSearch } from "react-icons/fi"
import { z } from "zod"

import { RobotsService } from "@/client"
import { RobotActionsMenu } from "@/components/Common/RobotActionsMenu"
import PendingRobots from "@/components/Pending/PendingRobots"
import AddRobot from "@/components/Robots/AddRobot"
import {
  PaginationItems,
  PaginationNextTrigger,
  PaginationPrevTrigger,
  PaginationRoot,
} from "@/components/ui/pagination.tsx"

const robotsSearchSchema = z.object({
  page: z.number().catch(1),
})

const PER_PAGE = 5

function getRobotsQueryOptions({ page }: { page: number }) {
  return {
    queryFn: () =>
      RobotsService.readRobots({
        skip: (page - 1) * PER_PAGE,
        limit: PER_PAGE,
      }),
    queryKey: ["robots", { page }],
  }
}

export const Route = createFileRoute("/_layout/robots")({
  component: Robots,
  validateSearch: (search) => robotsSearchSchema.parse(search),
})

function RobotsTable() {
  const navigate = useNavigate({ from: Route.fullPath })
  const { page } = Route.useSearch()

  const { data, isLoading, isPlaceholderData } = useQuery({
    ...getRobotsQueryOptions({ page }),
    placeholderData: (prevData) => prevData,
  })

  const setPage = (page: number) =>
    navigate({
      search: (prev: { [key: string]: string }) => ({ ...prev, page }),
    })

  const robots = data?.data.slice(0, PER_PAGE) ?? []
  const count = data?.count ?? 0

  if (isLoading) {
    return <PendingRobots />
  }

  if (robots.length === 0) {
    return (
      <EmptyState.Root>
        <EmptyState.Content>
          <EmptyState.Indicator>
            <FiSearch />
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
      <Table.Root size={{ base: "sm", md: "md" }}>
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
              <Table.Cell truncate maxW="sm">
                {robot.id}
              </Table.Cell>
              <Table.Cell truncate maxW="sm">
                {robot.name}
              </Table.Cell>
              <Table.Cell truncate maxW="sm">
                {robot.status}
              </Table.Cell>
              <Table.Cell
                color={!robot.description ? "gray" : "inherit"}
                truncate
                maxW="30%"
              >
                {robot.description || "N/A"}
              </Table.Cell>
              <Table.Cell>
                <RobotActionsMenu robot={robot} />
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
      <Flex justifyContent="flex-end" mt={4}>
        <PaginationRoot
          count={count}
          pageSize={PER_PAGE}
          onPageChange={({ page }) => setPage(page)}
        >
          <Flex>
            <PaginationPrevTrigger />
            <PaginationItems />
            <PaginationNextTrigger />
          </Flex>
        </PaginationRoot>
      </Flex>
    </>
  )
}

function Robots() {
  return (
    <Container maxW="full">
      <Heading size="lg" pt={12}>
        Robots Management
      </Heading>
      <AddRobot />
      <RobotsTable />
    </Container>
  )
}
