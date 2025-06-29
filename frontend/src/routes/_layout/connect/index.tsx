import { Container, Heading } from "@chakra-ui/react"
import { createFileRoute } from "@tanstack/react-router"
import { DashboardGrid } from "@/components/Dashboard/DashboardGrid"
import useAuth from "@/hooks/useAuth"

export const Route = createFileRoute("/_layout/connect/")({
  component: ConnectPage,
})

function ConnectPage() {
  const { user } = useAuth()

  if (!user) {
    return (
      <Container maxW="container.xl" py={8}>
        <Heading size="lg" mb={8}>
          로그인이 필요합니다.
        </Heading>
      </Container>
    )
  }

  return (
    <Container maxW="container.xl" py={8}>
      <Heading size="lg" mb={8}>
        로봇 대시보드
      </Heading>
      <DashboardGrid userId={user.id} />
    </Container>
  )
} 