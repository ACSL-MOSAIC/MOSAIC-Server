import {Box, Button, Container, Heading, VStack} from "@chakra-ui/react"
import {useMutation} from "@tanstack/react-query"
import {type SubmitHandler, useForm} from "react-hook-form"
import {FiLock} from "react-icons/fi"

import type {ApiError} from "@/client"
import {updatePasswordMeApi} from "@/client/service/user.api.ts"
import type {UserUpdatePasswordMeDto} from "@/client/service/user.dto.ts"
import useCustomToast from "@/hooks/useCustomToast"
import {confirmPasswordRules, handleError, passwordRules} from "@/utils"
import {PasswordInput} from "../ui/password-input"

interface UpdatePasswordForm extends UserUpdatePasswordMeDto {
  confirmPassword: string
}

const ChangePassword = () => {
  const {showSuccessToast} = useCustomToast()
  const {
    register,
    handleSubmit,
    reset,
    getValues,
    formState: {errors, isValid, isSubmitting},
  } = useForm<UpdatePasswordForm>({
    mode: "onBlur",
    criteriaMode: "all",
  })

  const mutation = useMutation({
    mutationFn: updatePasswordMeApi,
    onSuccess: () => {
      showSuccessToast("Password updated successfully.")
      reset()
    },
    onError: (err: ApiError) => {
      handleError(err)
    },
  })

  const onSubmit: SubmitHandler<UpdatePasswordForm> = async (data) => {
    mutation.mutate({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    })
  }

  return (
    <>
      <Container maxW="full">
        <Heading size="sm" py={4}>
          Change Password
        </Heading>
        <Box as="form" onSubmit={handleSubmit(onSubmit)}>
          <VStack gap={4} w={{base: "100%", md: "sm"}}>
            <PasswordInput
              type="currentPassword"
              startElement={<FiLock/>}
              {...register("currentPassword", passwordRules())}
              placeholder="Current Password"
              errors={errors}
            />
            <PasswordInput
              type="newPassword"
              startElement={<FiLock/>}
              {...register("newPassword", passwordRules())}
              placeholder="New Password"
              errors={errors}
            />
            <PasswordInput
              type="confirmPassword"
              startElement={<FiLock/>}
              {...register("confirmPassword", confirmPasswordRules(getValues))}
              placeholder="Confirm Password"
              errors={errors}
            />
          </VStack>
          <Button
            variant="solid"
            mt={4}
            type="submit"
            loading={isSubmitting}
            disabled={!isValid}
          >
            Save
          </Button>
        </Box>
      </Container>
    </>
  )
}
export default ChangePassword
