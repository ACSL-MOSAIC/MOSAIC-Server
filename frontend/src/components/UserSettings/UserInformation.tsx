import {
  Box,
  Button,
  Container,
  Flex,
  HStack,
  Heading,
  Input,
  Text,
} from "@chakra-ui/react"
import {useMutation, useQueryClient} from "@tanstack/react-query"
import {useState} from "react"
import {type SubmitHandler, useForm} from "react-hook-form"
import {FiCopy} from "react-icons/fi"

import type {ApiError} from "@/client"
import {updateUserMeApi} from "@/client/service/user.api.ts"
import type {UserUpdateMeDto} from "@/client/service/user.dto.ts"
import useAuth from "@/hooks/useAuth"
import useCustomToast from "@/hooks/useCustomToast"
import {handleError} from "@/utils"
import {Field} from "../ui/field"

const UserInformation = () => {
  const queryClient = useQueryClient()
  const {showSuccessToast} = useCustomToast()
  const [editMode, setEditMode] = useState(false)
  const {user: currentUser} = useAuth()
  const {
    register,
    handleSubmit,
    reset,
    getValues,
    formState: {isSubmitting, isDirty},
  } = useForm<UserUpdateMeDto>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      fullName: currentUser?.fullName,
    },
  })

  const toggleEditMode = () => {
    setEditMode(!editMode)
  }

  const mutation = useMutation({
    mutationFn: updateUserMeApi,
    onSuccess: () => {
      showSuccessToast("User updated successfully.")
    },
    onError: (err: ApiError) => {
      handleError(err)
    },
    onSettled: () => {
      queryClient.invalidateQueries()
    },
  })

  const onSubmit: SubmitHandler<UserUpdateMeDto> = async (data) => {
    mutation.mutate(data)
  }

  const onCancel = () => {
    reset()
    toggleEditMode()
  }

  const handleCopyUserId = async () => {
    if (currentUser?.id) {
      try {
        await navigator.clipboard.writeText(currentUser.id)
        showSuccessToast("User ID copied to clipboard")
      } catch (err) {
        console.error("Failed to copy User ID:", err)
      }
    }
  }

  return (
    <>
      <Container maxW="full">
        <Heading size="sm" py={4}>
          User Information
        </Heading>
        <Box
          w={{base: "100%", md: "md"}}
          as="form"
          onSubmit={handleSubmit(onSubmit)}
        >
          <Field label="Full name">
            {editMode ? (
              <Input
                {...register("fullName", {maxLength: 30})}
                type="text"
                size="md"
              />
            ) : (
              <Text
                fontSize="md"
                py={2}
                color={!currentUser?.fullName ? "gray" : "inherit"}
                truncate
                maxW="sm"
              >
                {currentUser?.fullName || "N/A"}
              </Text>
            )}
          </Field>
          <Field mt={4} label="Email">
            <Text fontSize="md" py={2} color="gray.600">
              {currentUser?.email}
            </Text>
          </Field>
          <Field mt={4} label="Role">
            <Text fontSize="md" py={2} color="gray.600">
              {currentUser?.isOrganizationAdmin ? "Admin" : "User"}
            </Text>
          </Field>
          <Field mt={4} label="User ID">
            <HStack alignItems="center" gap={2}>
              <Text fontSize="md" py={2} color="gray.600" fontFamily="mono">
                {currentUser?.id}
              </Text>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleCopyUserId}
                p={1}
              >
                <FiCopy size={14}/>
              </Button>
            </HStack>
          </Field>
          <Flex mt={4} gap={3}>
            <Button
              variant="solid"
              onClick={toggleEditMode}
              type={editMode ? "button" : "submit"}
              loading={editMode ? isSubmitting : false}
              disabled={editMode ? !isDirty || !getValues("fullName") : false}
            >
              {editMode ? "Save" : "Edit"}
            </Button>
            {editMode && (
              <Button
                variant="subtle"
                colorPalette="gray"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            )}
          </Flex>
        </Box>
      </Container>
    </>
  )
}

export default UserInformation
