import {IconButton} from "@chakra-ui/react"
import {BsThreeDotsVertical} from "react-icons/bs"
import {MenuContent, MenuRoot, MenuTrigger} from "../ui/menu"

import type {RobotPublic} from "@/client/service/robot.dto.ts"
import DeleteRobotDialog from "../Robots/DeleteRobotDialog.tsx"
import EditRobotDialog from "../Robots/EditRobotDialog.tsx"

interface RobotActionsMenuProps {
  robot: RobotPublic
}

export const RobotActionsMenu = ({robot}: RobotActionsMenuProps) => {
  return (
    <MenuRoot>
      <MenuTrigger asChild>
        <IconButton variant="ghost" color="inherit">
          <BsThreeDotsVertical/>
        </IconButton>
      </MenuTrigger>
      <MenuContent>
        <EditRobotDialog robot={robot}/>
        <DeleteRobotDialog id={robot.id}/>
      </MenuContent>
    </MenuRoot>
  )
}
