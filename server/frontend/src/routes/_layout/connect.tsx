import { Container, Heading } from "@chakra-ui/react"
import { createFileRoute } from "@tanstack/react-router"

import ConnectList from "@/components/Connect/ConnectList"

export const Route = createFileRoute("/_layout/connect")({
  component: ConnectPage,
})

function ConnectPage() {
  return (
    <Container maxW="full">
      <Heading size="lg" textAlign={{ base: "center", md: "left" }} py={12}>
        로봇 연결
      </Heading>
      <ConnectList />
    </Container>
  )
} 