import {Badge, Flex, Table} from "@chakra-ui/react"
import {useQuery, useQueryClient} from "@tanstack/react-query"
import {useNavigate} from "@tanstack/react-router"

import {UserActionsMenu} from "@/components/Common/UserActionsMenu"
import PendingUsers from "@/components/Pending/PendingUsers"
import {
  PaginationItems,
  PaginationNextTrigger,
  PaginationPrevTrigger,
  PaginationRoot,
} from "@/components/ui/pagination.tsx"
import {getOrganizationUserListApi} from "@/client/service/organization-user.api.ts"
import type {UserDto} from "@/client/service/user.dto.ts"
import {Route} from "@/routes/_layout/admin.tsx"

const PER_PAGE = 5

function getUsersQueryOptions({page}: { page: number }) {
  return {
    queryFn: () => getOrganizationUserListApi((page - 1) * PER_PAGE, PER_PAGE),
    queryKey: ["users", {page}],
  }
}

export function UsersTable() {
  const queryClient = useQueryClient()
  const currentUser = queryClient.getQueryData<UserDto>(["currentUser"])
  const navigate = useNavigate({from: Route.fullPath})
  const {page} = Route.useSearch()

  const {data, isLoading, isPlaceholderData} = useQuery({
    ...getUsersQueryOptions({page}),
    placeholderData: (prevData) => prevData,
  })

  const setPage = (page: number) =>
    navigate({
      search: (prev: { [key: string]: string }) => ({...prev, page}),
    })

  const users = data?.data.slice(0, PER_PAGE) ?? []
  const count = data?.count ?? 0

  if (isLoading) {
    return <PendingUsers/>
  }

  return (
    <>
      <Table.Root size={{base: "sm", md: "md"}}>
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader w="sm">Email</Table.ColumnHeader>
            <Table.ColumnHeader w="sm">Full name</Table.ColumnHeader>
            <Table.ColumnHeader w="sm">Role</Table.ColumnHeader>
            <Table.ColumnHeader w="sm">Status</Table.ColumnHeader>
            <Table.ColumnHeader w="sm">Actions</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {users?.map((user) => (
            <Table.Row key={user.id} opacity={isPlaceholderData ? 0.5 : 1}>
              <Table.Cell truncate maxW="sm">
                {user.email}
              </Table.Cell>
              <Table.Cell color={!user.fullName ? "gray" : "inherit"}>
                {user.fullName || "N/A"}
                {currentUser?.id === user.id && (
                  <Badge ml="1" colorScheme="teal">
                    You
                  </Badge>
                )}
              </Table.Cell>
              <Table.Cell>
                {user.isOrganizationAdmin ? "Organization Admin" : "User"}
              </Table.Cell>
              <Table.Cell>{user.isActive ? "Active" : "Inactive"}</Table.Cell>
              <Table.Cell>
                <UserActionsMenu
                  user={user}
                  disabled={currentUser?.id === user.id}
                />
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
