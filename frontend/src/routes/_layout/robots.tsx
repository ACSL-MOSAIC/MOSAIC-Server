import {Container, Heading} from "@chakra-ui/react"
import {createFileRoute} from "@tanstack/react-router"
import {z} from "zod"

import AddRobotDialog from "@/components/Robots/AddRobotDialog.tsx"
import {RobotsTable} from "@/components/Robots/RobotsTable.tsx"

const robotsSearchSchema = z.object({
  page: z.number().catch(1),
})

export const Route = createFileRoute("/_layout/robots")({
  component: Robots,
  validateSearch: (search) => robotsSearchSchema.parse(search),
})

function Robots() {
  return (
    <Container maxW="full">
      <Heading size="lg" pt={12}>
        Robots Management
      </Heading>
      <AddRobotDialog/>
      <RobotsTable/>
    </Container>
  )
}
