import {useMutation, useQueryClient} from "@tanstack/react-query"
import {Controller, type SubmitHandler, useForm} from "react-hook-form"

import {
  Button,
  DialogActionTrigger,
  DialogRoot,
  DialogTrigger,
  Flex,
  Input,
  Text,
  VStack,
} from "@chakra-ui/react"
import {useEffect, useState} from "react"
import {FaExchangeAlt} from "react-icons/fa"

import type {ApiError} from "@/client/core/ApiError"
import useCustomToast from "@/hooks/useCustomToast"
import {handleError} from "@/utils"
import {Checkbox} from "../ui/checkbox"
import {
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog"
import {Field} from "../ui/field"
import type {UserDto} from "@/client/service/user.dto.ts"
import type {OrganizationUpdateUserDto} from "@/client/service/organization-user.dto.ts"
import {updateOrganizationUserApi} from "@/client/service/organization-user.api.ts"

interface EditUserProps {
  user: UserDto
}

interface UserUpdateForm extends OrganizationUpdateUserDto {
  confirmPassword?: string
}

const EditUser = ({user}: EditUserProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const queryClient = useQueryClient()
  const {showSuccessToast} = useCustomToast()
  const {
    control,
    register,
    handleSubmit,
    reset,
    getValues,
    formState: {errors, isSubmitting},
  } = useForm<UserUpdateForm>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: user,
  })

  const mutation = useMutation({
    mutationFn: (data: UserUpdateForm) => updateOrganizationUserApi(data),
    onSuccess: () => {
      showSuccessToast("User updated successfully.")
      setIsOpen(false)
      reset()
    },
    onError: (err: ApiError) => {
      handleError(err)
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({queryKey: ["users"]})
    },
  })

  useEffect(() => {
    if (isOpen) {
      reset(user)
    }
  }, [isOpen, user, reset])

  const onSubmit: SubmitHandler<UserUpdateForm> = async (data) => {
    if (data.password === "") {
      data.password = undefined
    }
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
        <Button variant="ghost" size="sm">
          <FaExchangeAlt fontSize="16px"/>
          Edit User
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <Text mb={4}>Update the user details below.</Text>
            <VStack gap={4}>
              <Field
                invalid={!!errors.fullName}
                errorText={errors.fullName?.message}
                label="Full Name"
              >
                <Input
                  id="name"
                  {...register("fullName")}
                  placeholder="Full name"
                  type="text"
                />
              </Field>

              <Field
                invalid={!!errors.password}
                errorText={errors.password?.message}
                label="Set Password"
              >
                <Input
                  id="password"
                  {...register("password", {
                    minLength: {
                      value: 8,
                      message: "Password must be at least 8 characters",
                    },
                  })}
                  placeholder="Password"
                  type="password"
                />
              </Field>

              <Field
                invalid={!!errors.confirmPassword}
                errorText={errors.confirmPassword?.message}
                label="Confirm Password"
              >
                <Input
                  id="confirmPassword"
                  {...register("confirmPassword", {
                    validate: (value) =>
                      value === getValues().password ||
                      "The passwords do not match",
                  })}
                  placeholder="Password"
                  type="password"
                />
              </Field>
            </VStack>

            <Flex mt={4} direction="column" gap={4}>
              <Controller
                control={control}
                name="isOrganizationAdmin"
                render={({field}) => (
                  <Field disabled={field.disabled} colorPalette="teal">
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={({checked}) => field.onChange(checked)}
                    >
                      Is Organization Admin?
                    </Checkbox>
                  </Field>
                )}
              />
              <Controller
                control={control}
                name="isActive"
                render={({field}) => (
                  <Field disabled={field.disabled} colorPalette="teal">
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={({checked}) => field.onChange(checked)}
                    >
                      Is active?
                    </Checkbox>
                  </Field>
                )}
              />
            </Flex>
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
            <Button variant="solid" type="submit" loading={isSubmitting}>
              Save
            </Button>
          </DialogFooter>
          <DialogCloseTrigger/>
        </form>
      </DialogContent>
    </DialogRoot>
  )
}

export default EditUser
