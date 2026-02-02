import {WebSocketProvider} from "@/contexts/WebSocketProvider"
import {Flex} from "@chakra-ui/react"
import {Outlet, createFileRoute, redirect} from "@tanstack/react-router"

import Navbar from "@/components/Common/Navbar"
import Sidebar from "@/components/Common/Sidebar"
import {isLoggedIn} from "@/hooks/useAuth"
import {MosaicProvider} from "@/contexts/MosaicProvider"

export const Route = createFileRoute("/_layout")({
  component: Layout,
  beforeLoad: async () => {
    if (!isLoggedIn()) {
      throw redirect({
        to: "/login",
      })
    }
  },
})

function Layout() {
  return (
    <WebSocketProvider>
      <MosaicProvider>
        <Flex>
          <Sidebar/>
          <Flex flex="1" flexDir="column">
            <Navbar/>
            <Outlet/>
          </Flex>
        </Flex>
      </MosaicProvider>
    </WebSocketProvider>
  )
}
