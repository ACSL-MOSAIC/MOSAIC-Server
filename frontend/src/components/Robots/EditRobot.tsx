import {
  Button,
  ButtonGroup,
  DialogActionTrigger,
  Input,
  Select,
  Text,
  VStack,
  createListCollection,
} from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { type SubmitHandler, useForm } from "react-hook-form"
import { FaExchangeAlt } from "react-icons/fa"

import {
  type ApiError,
  type RobotPublic,
  type RobotStatus,
  RobotsService,
} from "@/client"
import useCustomToast from "@/hooks/useCustomToast"
import { handleError } from "@/utils"
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
import { Field } from "../ui/field"

interface EditRobotProps {
  robot: RobotPublic
}

interface RobotUpdateForm {
  name: string
  status: RobotStatus
  description?: string
}

const statusOptions = createListCollection({
  items: [
    { label: "Ready to Connect", value: "READY_TO_CONNECT" as RobotStatus },
    { label: "Connecting", value: "CONNECTING" as RobotStatus },
    { label: "Connected", value: "CONNECTED" as RobotStatus },
    { label: "Disconnected", value: "DISCONNECTED" as RobotStatus },
    { label: "Removed", value: "REMOVED" as RobotStatus },
  ],
})

const EditRobot = ({ robot }: EditRobotProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const queryClient = useQueryClient()
  const { showSuccessToast } = useCustomToast()
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RobotUpdateForm>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      ...robot,
      description: robot.description ?? undefined,
    },
  })

  const status = watch("status")

  const mutation = useMutation({
    mutationFn: (data: RobotUpdateForm) =>
      RobotsService.updateRobot({ id: robot.id, requestBody: data }),
    onSuccess: () => {
      showSuccessToast("Robot updated successfully.")
      reset()
      setIsOpen(false)
    },
    onError: (err: ApiError) => {
      handleError(err)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["robots"] })
    },
  })

  const onSubmit: SubmitHandler<RobotUpdateForm> = async (data) => {
    mutation.mutate(data)
  }

  return (
    <DialogRoot
      size={{ base: "xs", md: "md" }}
      placement="center"
      open={isOpen}
      onOpenChange={({ open }) => setIsOpen(open)}
    >
      <DialogTrigger asChild>
        <Button variant="ghost">
          <FaExchangeAlt fontSize="16px" />
          Edit Robot
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Edit Robot</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <Text mb={4}>Update the robot details below.</Text>
            <VStack gap={4}>
              <Field
                required
                invalid={!!errors.name}
                errorText={errors.name?.message}
                label="Name"
              >
                <Input
                  id="name"
                  {...register("name", {
                    required: "Name is required",
                  })}
                  placeholder="Name"
                  type="text"
                />
              </Field>

              <Field
                required
                invalid={!!errors.status}
                errorText={errors.status?.message}
                label="Status"
              >
                <Select.Root
                  collection={statusOptions}
                  value={[status]}
                  onValueChange={({ value }) =>
                    setValue("status", value[0] as RobotStatus, {
                      shouldValidate: true,
                    })
                  }
                  size="md"
                >
                  <Select.Control>
                    <Select.Trigger>
                      <Select.ValueText placeholder="Select status" />
                    </Select.Trigger>
                    <Select.IndicatorGroup>
                      <Select.Indicator />
                    </Select.IndicatorGroup>
                  </Select.Control>
                  <Select.Positioner>
                    <Select.Content
                      bg="white"
                      borderRadius="md"
                      boxShadow="md"
                      minW="200px"
                      zIndex={1000}
                    >
                      {statusOptions.items.map((option) => (
                        <Select.Item
                          item={option}
                          key={option.value}
                          px={4}
                          py={2}
                          cursor="pointer"
                          _hover={{ bg: "gray.100" }}
                        >
                          {option.label}
                          <Select.ItemIndicator />
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Positioner>
                </Select.Root>
              </Field>

              <Field
                invalid={!!errors.description}
                errorText={errors.description?.message}
                label="Description"
              >
                <Input
                  id="description"
                  {...register("description")}
                  placeholder="Description"
                  type="text"
                />
              </Field>
            </VStack>
          </DialogBody>

          <DialogFooter gap={2}>
            <ButtonGroup>
              <DialogActionTrigger asChild>
                <Button
                  variant="subtle"
                  colorPalette="gray"
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              </DialogActionTrigger>
              <Button variant="solid" type="submit" loading={isSubmitting}>
                Save
              </Button>
            </ButtonGroup>
          </DialogFooter>
        </form>
        <DialogCloseTrigger />
      </DialogContent>
    </DialogRoot>
  )
}

export default EditRobot
