import {Container, Heading, Tabs} from "@chakra-ui/react"
import {createFileRoute} from "@tanstack/react-router"

import ChangePassword from "@/components/UserSettings/ChangePassword"
import UserInformation from "@/components/UserSettings/UserInformation"
import useAuth from "@/hooks/useAuth"

const tabsConfig = [
  {value: "my-profile", title: "My profile", component: UserInformation},
  {value: "password", title: "Password", component: ChangePassword},
]

export const Route = createFileRoute("/_layout/settings")({
  component: UserSettings,
})

function UserSettings() {
  const {user: currentUser} = useAuth()

  if (!currentUser) {
    return null
  }

  return (
    <Container maxW="full">
      <Heading size="lg" textAlign={{base: "center", md: "left"}} py={12}>
        User Settings
      </Heading>

      <Tabs.Root defaultValue="my-profile" variant="subtle">
        <Tabs.List>
          {tabsConfig.map((tab) => (
            <Tabs.Trigger key={tab.value} value={tab.value}>
              {tab.title}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
        {tabsConfig.map((tab) => (
          <Tabs.Content key={tab.value} value={tab.value}>
            <tab.component/>
          </Tabs.Content>
        ))}
      </Tabs.Root>
    </Container>
  )
}
