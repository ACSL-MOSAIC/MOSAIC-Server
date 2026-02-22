import {
  Box,
  Button,
  Code,
  DialogTitle,
  Flex,
  Spinner,
  Text,
} from "@chakra-ui/react"
import { useState } from "react"
import { FiEye } from "react-icons/fi"

import { getRobotApi } from "@/client/service/robot.api.ts"
import type { RobotInfoDto } from "@/client/service/robot.dto.ts"
import {
  DialogActionTrigger,
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTrigger,
} from "@/components/ui/dialog"
import useCustomToast from "@/hooks/useCustomToast"

interface PreviewRobotConfigProps {
  robot: RobotInfoDto
}

const PreviewRobotConfig = ({ robot }: PreviewRobotConfigProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [configData, setConfigData] = useState<string | null>(null)
  const { showErrorToast } = useCustomToast()

  const loadConfigData = async () => {
    setIsLoading(true)
    try {
      const response = await getRobotApi(robot.id)
      setConfigData(response.connectorConfig)
    } catch (error) {
      console.error("Failed to load config data:", error)
      showErrorToast("Failed to load config data")
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenChange = ({ open }: { open: boolean }) => {
    setIsOpen(open)
    if (open && !configData) {
      loadConfigData()
    }
    if (!open) {
      setConfigData(null)
    }
  }

  // Format JSON for display
  const formattedConfig = configData
    ? JSON.stringify(JSON.parse(configData), null, 2)
    : null

  return (
    <DialogRoot
      size={{ base: "md", md: "lg" }}
      placement="center"
      open={isOpen}
      onOpenChange={handleOpenChange}
    >
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <FiEye />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Config: {robot.name}</DialogTitle>
        </DialogHeader>
        <DialogBody>
          {isLoading ? (
            <Flex justifyContent="center" alignItems="center" minH="300px">
              <Spinner size="xl" />
            </Flex>
          ) : (
            <Box>
              <Text fontWeight="bold" mb={2}>
                Connector Configuration
              </Text>
              {formattedConfig ? (
                <Code
                  display="block"
                  p={3}
                  borderRadius="md"
                  whiteSpace="pre-wrap"
                  maxH="400px"
                  overflowY="auto"
                >
                  {formattedConfig}
                </Code>
              ) : (
                <Text color="gray.500">No config data</Text>
              )}
            </Box>
          )}
        </DialogBody>

        <DialogFooter>
          <DialogActionTrigger asChild>
            <Button variant="subtle" colorPalette="gray">
              Close
            </Button>
          </DialogActionTrigger>
        </DialogFooter>
        <DialogCloseTrigger />
      </DialogContent>
    </DialogRoot>
  )
}

export default PreviewRobotConfig
