import {useMutation, useQueryClient} from "@tanstack/react-query"
import {Controller, type SubmitHandler, useForm} from "react-hook-form"

import type {ApiError} from "@/client/core/ApiError"
import useCustomToast from "@/hooks/useCustomToast"
import {emailPattern, handleError} from "@/utils"
import {
  Button,
  DialogActionTrigger,
  DialogTitle,
  Flex,
  Input,
  Text,
  VStack,
} from "@chakra-ui/react"
import {useState} from "react"
import {FaPlus} from "react-icons/fa"
import {Checkbox} from "../ui/checkbox"
import {
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTrigger,
} from "../ui/dialog"
import {Field} from "../ui/field"
import type {OrganizationCreateUserDto} from "@/client/service/organization-user.dto.ts"
import {createOrganizationUserApi} from "@/client/service/organization-user.api.ts"

interface UserCreateForm extends OrganizationCreateUserDto {
  confirmPassword: string
}

const AddUser = () => {
  const [isOpen, setIsOpen] = useState(false)
  const queryClient = useQueryClient()
  const {showSuccessToast} = useCustomToast()
  const {
    control,
    register,
    handleSubmit,
    reset,
    getValues,
    formState: {errors, isValid, isSubmitting},
  } = useForm<UserCreateForm>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      email: "",
      fullName: "",
      password: "",
      confirmPassword: "",
      isOrganizationAdmin: false,
    },
  })

  const mutation = useMutation({
    mutationFn: (data: OrganizationCreateUserDto) =>
      createOrganizationUserApi(data),
    onSuccess: () => {
      showSuccessToast("User created successfully.")
      reset()
      setIsOpen(false)
    },
    onError: (err: ApiError) => {
      handleError(err)
    },
    onSettled: () => {
      queryClient.invalidateQueries({queryKey: ["users"]})
    },
  })

  const onSubmit: SubmitHandler<UserCreateForm> = (data) => {
    mutation.mutate({
      email: data.email,
      fullName: data.fullName,
      password: data.password,
      isOrganizationAdmin: data.isOrganizationAdmin,
    })
  }

  return (
    <DialogRoot
      size={{base: "xs", md: "md"}}
      placement="center"
      open={isOpen}
      onOpenChange={({open}) => setIsOpen(open)}
    >
      <DialogTrigger asChild>
        <Button value="add-user" my={4}>
          <FaPlus fontSize="16px"/>
          Add User
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Add User</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <Text mb={4}>
              Fill in the form below to add a new user to the system.
            </Text>
            <VStack gap={4}>
              <Field
                required
                invalid={!!errors.email}
                errorText={errors.email?.message}
                label="Email"
              >
                <Input
                  id="email"
                  {...register("email", {
                    required: "Email is required",
                    pattern: emailPattern,
                  })}
                  placeholder="Email"
                  type="email"
                />
              </Field>

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
                required
                invalid={!!errors.password}
                errorText={errors.password?.message}
                label="Set Password"
              >
                <Input
                  id="password"
                  {...register("password", {
                    required: "Password is required",
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
                required
                invalid={!!errors.confirmPassword}
                errorText={errors.confirmPassword?.message}
                label="Confirm Password"
              >
                <Input
                  id="confirmPassword"
                  {...register("confirmPassword", {
                    required: "Please confirm your password",
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
        <DialogCloseTrigger/>
      </DialogContent>
    </DialogRoot>
  )
}

export default AddUser
