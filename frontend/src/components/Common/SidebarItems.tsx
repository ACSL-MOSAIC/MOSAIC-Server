import {Box, Flex, Icon, IconButton, Text} from "@chakra-ui/react"
import {Link as RouterLink} from "@tanstack/react-router"
import {FaBars, FaRobot} from "react-icons/fa"
import {FaLink} from "react-icons/fa"
import {FiMap, FiSettings, FiUsers} from "react-icons/fi"
import type {IconType} from "react-icons/lib"

import useAuth from "@/hooks/useAuth.ts"
import {useState} from "react"

const items = [
  {icon: FaRobot, title: "Robots", path: "/robots"},
  {icon: FiMap, title: "Occupancy Maps", path: "/occupancy-maps"},
  {icon: FaLink, title: "Dashboard", path: "/dashboard"},
  {icon: FiSettings, title: "User Settings", path: "/settings"},
]

interface SidebarItemsProps {
  onClose?: () => void
}

interface Item {
  icon: IconType
  title: string
  path: string
}

const SidebarItems = ({onClose}: SidebarItemsProps) => {
  const {user} = useAuth()
  const [fold, setFold] = useState(true)

  const finalItems: Item[] = user?.is_superuser
    ? [...items, {icon: FiUsers, title: "Admin", path: "/admin"}]
    : items

  const listItems = finalItems.map(({icon, title, path}) => (
    <RouterLink key={title} to={path} onClick={onClose}>
      <Flex
        gap={4}
        px={4}
        py={2}
        minH="35px"
        _hover={{
          background: "gray.subtle",
        }}
        alignItems="center"
        justifyContent="flex-start"
        fontSize="sm"
      >
        <Icon
          as={icon}
          boxSize="16px"
          display="flex"
          alignItems="center"
          justifyContent="center"
        />
        {!fold && <Text>{title}</Text>}
      </Flex>
    </RouterLink>
  ))

  return (
    <>
      <Flex>
        {fold ? (
          <IconButton
            onClick={() => setFold(false)}
            variant="ghost"
            px={3.5}
            py={2}
            minH="35px"
            color="inherit"
          >
            <Icon as={FaBars} alignSelf="center"/>
          </IconButton>
        ) : (
          <>
            <Flex flex="1" justifyContent="flex-start" alignItems="center">
              <Text fontSize="xs" px={4} py={2} fontWeight="bold">
                Menu
              </Text>
            </Flex>
            <IconButton
              onClick={() => setFold(true)}
              variant="ghost"
              px={3}
              py={2}
              minH="35px"
              color="inherit"
            >
              <Icon as={FaBars} alignSelf="center"/>
            </IconButton>
          </>
        )}
      </Flex>
      <Box minW={fold ? "0" : "10vw"}>{listItems}</Box>
    </>
  )
}

export default SidebarItems
