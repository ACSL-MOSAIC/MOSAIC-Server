import { Box } from "@chakra-ui/react"
import SidebarItems from "./SidebarItems"

const Sidebar = () => {
  return (
    <>
      <Box
        display={{ base: "none", md: "flex" }}
        position="sticky"
        bg="bg.subtle"
        top={0}
        h="100vh"
        p={4}
      >
        <Box w="100%">
          <SidebarItems />
        </Box>
      </Box>
    </>
  )
}
export default Sidebar
