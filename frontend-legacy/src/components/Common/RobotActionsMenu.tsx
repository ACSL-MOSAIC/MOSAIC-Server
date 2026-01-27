import { IconButton } from "@chakra-ui/react"
import { BsThreeDotsVertical } from "react-icons/bs"
import { MenuContent, MenuRoot, MenuTrigger } from "../ui/menu"

import type { RobotPublic } from "@/client/service/robot.dto.ts"
import DeleteRobot from "../Robots/DeleteRobot"
import EditRobot from "../Robots/EditRobot"

interface RobotActionsMenuProps {
  robot: RobotPublic
}

export const RobotActionsMenu = ({ robot }: RobotActionsMenuProps) => {
  return (
    <MenuRoot>
      <MenuTrigger asChild>
        <IconButton variant="ghost" color="inherit">
          <BsThreeDotsVertical />
        </IconButton>
      </MenuTrigger>
      <MenuContent>
        <EditRobot robot={robot} />
        <DeleteRobot id={robot.id} />
      </MenuContent>
    </MenuRoot>
  )
}
