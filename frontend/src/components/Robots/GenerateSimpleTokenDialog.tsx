import {
  Button,
  DialogActionTrigger,
  IconButton,
  Input,
  Text,
  VStack,
} from "@chakra-ui/react"
import {useMutation} from "@tanstack/react-query"
import {useState} from "react"
import {FiSettings} from "react-icons/fi"

import type {ApiError} from "@/client"
import {generateSimpleTokenApi} from "@/client/service/robot-auth.api.ts"
import type {RobotInfoDto} from "@/client/service/robot.dto.ts"
import useCustomToast from "@/hooks/useCustomToast"
import {handleError} from "@/utils"
import {
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog"
import {Field} from "../ui/field"

interface GenerateSimpleTokenProps {
  robot: RobotInfoDto
}

const GenerateSimpleTokenDialog = ({robot}: GenerateSimpleTokenProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const {showSuccessToast} = useCustomToast()

  const mutation = useMutation({
    mutationFn: () => generateSimpleTokenApi({robotId: robot.id}),
    onSuccess: (data) => {
      setToken(data.token)
      showSuccessToast("Token generated successfully.")
    },
    onError: (err: ApiError) => {
      handleError(err)
    },
  })

  const handleCopyToken = async () => {
    if (token) {
      try {
        await navigator.clipboard.writeText(token)
        showSuccessToast("Token copied to clipboard")
      } catch (err) {
        console.error("Failed to copy token:", err)
      }
    }
  }

  const handleClose = () => {
    setIsOpen(false)
    setToken(null)
  }

  return (
    <DialogRoot
      size={{base: "xs", md: "md"}}
      placement="center"
      open={isOpen}
      onOpenChange={({open}) => {
        setIsOpen(open)
        if (!open) {
          setToken(null)
        }
      }}
    >
      <DialogTrigger asChild>
        <IconButton variant="ghost" size="sm" aria-label="Generate token">
          <FiSettings/>
        </IconButton>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generate Simple Token</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <Text mb={4}>
            Generate a simple authentication token for {robot.name}.
          </Text>
          <VStack gap={4}>
            {!token ? (
              <Button
                variant="solid"
                onClick={() => mutation.mutate()}
                loading={mutation.isPending}
                w="full"
              >
                Generate Token
              </Button>
            ) : (
              <Field label="Token">
                <Input
                  value={token}
                  readOnly
                  onClick={handleCopyToken}
                  cursor="pointer"
                />
              </Field>
            )}
          </VStack>
        </DialogBody>

        <DialogFooter gap={2}>
          {token && (
            <Button variant="solid" onClick={handleCopyToken}>
              Copy Token
            </Button>
          )}
          <DialogActionTrigger asChild>
            <Button variant="subtle" colorPalette="gray" onClick={handleClose}>
              Close
            </Button>
          </DialogActionTrigger>
        </DialogFooter>
        <DialogCloseTrigger/>
      </DialogContent>
    </DialogRoot>
  )
}

export default GenerateSimpleTokenDialog
