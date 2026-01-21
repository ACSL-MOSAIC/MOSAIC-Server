import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useRef, useState } from "react"
import { type SubmitHandler, useForm } from "react-hook-form"

import {
  Button,
  DialogActionTrigger,
  DialogTitle,
  HStack,
  Input,
  Text,
  VStack,
} from "@chakra-ui/react"
import { FaPlus, FaRandom } from "react-icons/fa"

import type { ApiError } from "@/client/core/ApiError"
import { createRobotApi } from "@/client/service/robot.api.ts"
import type { RobotCreate } from "@/client/service/robot.dto.ts"
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
    formState: { errors, isValid, isSubmitting },
  } = useForm<RobotCreate>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      id: "",
      name: "",
      description: "",
    },
  })

  const handleGenerateUUID = () => {
    const newUUID = crypto.randomUUID()
    setValue("id", newUUID)
  }

  const mutation = useMutation({
    mutationFn: (data: RobotCreate) => createRobotApi(data),
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
                required
                invalid={!!errors.id}
                errorText={errors.id?.message}
                label="ID"
              >
                <HStack alignItems="stretch" width="100%">
                  <Input
                    id="id"
                    {...register("id")}
                    placeholder="Enter custom ID (uuid format)"
                    type="text"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateUUID}
                  >
                    <FaRandom />
                  </Button>
                </HStack>
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
