import { Container, Heading } from "@chakra-ui/react"
import { createFileRoute } from "@tanstack/react-router"

import ConnectRobot from "@/components/Connect/ConnectRobot"

export const Route = createFileRoute("/_layout/connect/$robotId")({
  component: ConnectRobotPage,
})

function ConnectRobotPage() {
  const { robotId } = Route.useParams()

  return (
    <Container maxW="full">
      <Heading size="lg" textAlign={{ base: "center", md: "left" }} py={12}>
        로봇 연결
      </Heading>
      <ConnectRobot robotId={robotId} />
    </Container>
  )
} 