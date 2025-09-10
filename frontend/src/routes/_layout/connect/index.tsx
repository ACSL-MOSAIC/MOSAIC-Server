import { DashboardGrid } from "@/components/Dashboard/DashboardGrid"
import { DynamicTypeManager } from "@/components/Dashboard/DynamicTypeManager"
import useAuth from "@/hooks/useAuth"
import { Container, Heading } from "@chakra-ui/react"
import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"

export const Route = createFileRoute("/_layout/connect/")({
  component: ConnectPage,
})

function ConnectPage() {
  const { user } = useAuth()
  const [dynamicTypeModalState, setDynamicTypeModalState] = useState<{
    isOpen: boolean
    robotId: string
  }>({ isOpen: false, robotId: "" })

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
        <DashboardGrid
          onOpenDynamicTypeModal={(robotId: string) =>
            setDynamicTypeModalState({ isOpen: true, robotId })
          }
        />
      </Container>

      {/* DynamicTypeManager를 Container 밖에 배치 */}
      <DynamicTypeManager
        robotId={dynamicTypeModalState.robotId}
        isOpen={dynamicTypeModalState.isOpen}
        onClose={() => setDynamicTypeModalState({ isOpen: false, robotId: "" })}
        onTypeUpdated={() => {
          console.log("Dynamic types updated")
        }}
      />
    </>
  )
}
