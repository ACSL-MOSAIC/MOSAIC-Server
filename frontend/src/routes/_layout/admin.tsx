import {Container, Heading} from "@chakra-ui/react"
import {createFileRoute} from "@tanstack/react-router"
import {z} from "zod"

import AddUser from "@/components/Admin/AddUser"
import {UsersTable} from "@/components/Admin/UsersTable.tsx"

const usersSearchSchema = z.object({
  page: z.number().catch(1),
})

export const Route = createFileRoute("/_layout/admin")({
  component: Admin,
  validateSearch: (search) => usersSearchSchema.parse(search),
})

function Admin() {
  return (
    <Container maxW="full">
      <Heading size="lg" pt={12}>
        Users Management
      </Heading>

      <AddUser/>
      <UsersTable/>
    </Container>
  )
}
