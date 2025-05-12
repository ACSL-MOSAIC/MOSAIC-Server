import { Container, Heading } from "@chakra-ui/react"
import { createFileRoute } from "@tanstack/react-router"
import { WebSocketProvider } from "@/contexts/WebSocketContext"
import ConnectList from "@/components/Connect/ConnectList"

export const Route = createFileRoute("/_layout/connect")({
  component: ConnectPage,
})

function ConnectPage() {
  return (
    <Container maxW="container.xl" py={8}>
      <Heading size="lg" mb={8}>
        로봇 연결
      </Heading>
      <WebSocketProvider>
        <ConnectList />
      </WebSocketProvider>
    </Container>
  )
} 