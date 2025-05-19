import  { useState, useRef } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { type SubmitHandler, useForm } from "react-hook-form"

import {
  Button,
  DialogActionTrigger,
  DialogTitle,
  Input,
  Select,
  Text,
  VStack,
  createListCollection,
} from "@chakra-ui/react"
import { FaPlus } from "react-icons/fa"

import { type RobotCreate, type RobotStatus, RobotsService } from "@/client"
import type { ApiError } from "@/client/core/ApiError"
import useCustomToast from "@/hooks/useCustomToast"
import { handleError } from "@/utils"
import {
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTrigger,
} from "../ui/dialog"
import { Field } from "../ui/field"

const statusOptions = createListCollection({
  items: [
    { label: "Ready to Connect", value: "READY_TO_CONNECT" as RobotStatus },
    { label: "Connecting", value: "CONNECTING" as RobotStatus },
    { label: "Connected", value: "CONNECTED" as RobotStatus },
    { label: "Disconnected", value: "DISCONNECTED" as RobotStatus },
    { label: "Removed", value: "REMOVED" as RobotStatus },
  ],
})

const AddRobot = () => {
  const [isOpen, setIsOpen] = useState(false)
  const dialogContentRef = useRef<HTMLDivElement>(null)
  const queryClient = useQueryClient()
  const { showSuccessToast } = useCustomToast()
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isValid, isSubmitting },
  } = useForm<RobotCreate>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      name: "",
      status: "DISCONNECTED" as RobotStatus,
      description: "",
      id: "",
    },
  })

  const status = watch("status") as RobotStatus

  const mutation = useMutation({
    mutationFn: (data: RobotCreate) =>
      RobotsService.createRobot({ requestBody: data }),
    onSuccess: () => {
      showSuccessToast("Robot created successfully.")
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

  const onSubmit: SubmitHandler<RobotCreate> = (data) => {
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
        <Button value="add-robot" my={4}>
          <FaPlus fontSize="16px" />
          Add Robot
        </Button>
      </DialogTrigger>
      <DialogContent ref={dialogContentRef}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Add Robot</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <Text mb={4}>Fill in the details to add a new robot.</Text>
            <VStack gap={4}>
              <Field
                invalid={!!errors.id}
                errorText={errors.id?.message}
                label="ID (Optional)"
              >
                <Input
                  id="id"
                  {...register("id")}
                  placeholder="Enter custom ID (optional)"
                  type="text"
                />
              </Field>

              <Field
                required
                invalid={!!errors.name}
                errorText={errors.name?.message}
                label="Name"
              >
                <Input
                  id="name"
                  {...register("name", {
                    required: "Name is required.",
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
                  onValueChange={({ value }) => setValue("status", value[0] as RobotStatus, { shouldValidate: true })}
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
            <DialogActionTrigger asChild>
              <Button
                variant="subtle"
                colorPalette="gray"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </DialogActionTrigger>
            <Button
              variant="solid"
              type="submit"
              disabled={!isValid}
              loading={isSubmitting}
            >
              Save
            </Button>
          </DialogFooter>
        </form>
        <DialogCloseTrigger />
      </DialogContent>
    </DialogRoot>
  )
}

export default AddRobot 