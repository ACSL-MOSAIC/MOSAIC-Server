import useAuth from "@/hooks/useAuth"
import {Container, Heading} from "@chakra-ui/react"
import {createFileRoute} from "@tanstack/react-router"

export const Route = createFileRoute("/_layout/dashboard")({
  component: DashboardPage,
})

function DashboardPage() {
  const {user} = useAuth()

  if (!user) {
    return (
      <Container maxW="full" py={8}>
        <Heading size="lg" mb={8}>
          로그인이 필요합니다.
        </Heading>
      </Container>
    )
  }

  return (
    <>
      <Container maxW="full" py={4}>
        <Heading size="lg" mb={8}>
          개발하즈아~!
        </Heading>
      </Container>
    </>
  )
}
