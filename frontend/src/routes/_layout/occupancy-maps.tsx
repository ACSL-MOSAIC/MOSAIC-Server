import {
  Container,
  Heading,
} from "@chakra-ui/react"
import {createFileRoute} from "@tanstack/react-router"
import {z} from "zod"

import AddOccupancyMap from "@/components/OccupancyMaps/AddOccupancyMap"
import {OccupancyMapsTable} from "@/components/OccupancyMaps/OccupancyMapsTable.tsx";

const occupancyMapsSearchSchema = z.object({
  page: z.number().catch(1),
})

export const Route = createFileRoute("/_layout/occupancy-maps")({
  component: OccupancyMaps,
  validateSearch: (search) => occupancyMapsSearchSchema.parse(search),
})

function OccupancyMaps() {
  return (
    <Container maxW="full">
      <Heading size="lg" pt={12}>
        Occupancy Maps Management
      </Heading>
      <AddOccupancyMap/>
      <OccupancyMapsTable/>
    </Container>
  )
}
