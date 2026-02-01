import {
  Button,
  ButtonGroup,
  DialogActionTrigger,
  Input,
  NativeSelectField,
  NativeSelectRoot,
  Text,
  VStack,
} from "@chakra-ui/react"
import {useMutation, useQueryClient} from "@tanstack/react-query"
import {useState} from "react"
import {type SubmitHandler, useForm} from "react-hook-form"
import {FaExchangeAlt} from "react-icons/fa"

import type {ApiError} from "@/client"
import {updateRobotApi} from "@/client/service/robot.api.ts"
import type {
  RobotInfoDto,
  RobotUpdateDto,
} from "@/client/service/robot.dto.ts"
import {ROBOT_AUTH_TYPES} from "@/client/service/robot.dto.ts"
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

interface EditRobotProps {
  robot: RobotInfoDto
}

const EditRobotDialog = ({robot}: EditRobotProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const queryClient = useQueryClient()
  const {showSuccessToast} = useCustomToast()
  const {
    register,
    handleSubmit,
    reset,
    formState: {errors, isSubmitting},
  } = useForm<RobotUpdateDto>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      ...robot,
      description: robot.description ?? undefined,
    },
  })

  const mutation = useMutation({
    mutationFn: (data: RobotUpdateDto) => updateRobotApi(robot.id, data),
    onSuccess: () => {
      showSuccessToast("Robot updated successfully.")
      reset()
      setIsOpen(false)
    },
    onError: (err: ApiError) => {
      handleError(err)
    },
    onSettled: () => {
      queryClient.invalidateQueries({queryKey: ["robots"]})
    },
  })

  const onSubmit: SubmitHandler<RobotUpdateDto> = async (data) => {
    mutation.mutate(data)
  }

  return (
    <DialogRoot
      size={{base: "xs", md: "md"}}
      placement="center"
      open={isOpen}
      onOpenChange={({open}) => setIsOpen(open)}
    >
      <DialogTrigger asChild>
        <Button variant="ghost">
          <FaExchangeAlt fontSize="16px"/>
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

              <Field
                invalid={!!errors.authType}
                errorText={errors.authType?.message}
                label="Auth Type"
              >
                <NativeSelectRoot>
                  <NativeSelectField
                    id="authType"
                    {...register("authType", {
                      required: "Auth Type is required.",
                      valueAsNumber: true,
                    })}
                  >
                    {ROBOT_AUTH_TYPES.map((authType) => (
                      <option key={authType.value} value={authType.value}>
                        {authType.label}
                      </option>
                    ))}
                  </NativeSelectField>
                </NativeSelectRoot>
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
        <DialogCloseTrigger/>
      </DialogContent>
    </DialogRoot>
  )
}

export default EditRobotDialog
