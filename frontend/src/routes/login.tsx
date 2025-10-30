import { Button, Container, Image, Input } from "@chakra-ui/react"
import { createFileRoute, redirect } from "@tanstack/react-router"
import { useState } from "react"
import { FiLock, FiMail } from "react-icons/fi"

import type { Body_users_login_access_token as AccessToken } from "@/client/service/user.dto.ts"
import { Field } from "@/components/ui/field"
import { InputGroup } from "@/components/ui/input-group"
import { PasswordInput } from "@/components/ui/password-input"
import useAuth, { isLoggedIn } from "@/hooks/useAuth"
import Logo from "/assets/images/acsl-logo.svg"
import { emailPattern } from "../utils"

export const Route = createFileRoute("/login")({
  component: Login,
  beforeLoad: async () => {
    if (isLoggedIn()) {
      throw redirect({
        to: "/",
      })
    }
  },
})

function Login() {
  const { loginMutation, disconnectMutation, error, resetError } = useAuth()
  const [formData, setFormData] = useState<AccessToken>({
    username: "",
    password: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<{
    username?: string
    password?: string
  }>({})

  const validateForm = () => {
    const newErrors: { username?: string; password?: string } = {}

    if (!formData.username) {
      newErrors.username = "Username is required"
    } else if (!emailPattern.value.test(formData.username)) {
      newErrors.username = emailPattern.message
    }

    if (!formData.password) {
      newErrors.password = "Password is required"
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm() || isSubmitting) return

    setIsSubmitting(true)
    resetError()

    try {
      const response = await loginMutation.mutateAsync(formData)
      if (response.existing_connection && response.user_id) {
        if (
          window.confirm(
            "이미 다른 기기에서 로그인되어 있습니다. 기존 연결을 해제하고 로그인하시겠습니까?",
          )
        ) {
          await disconnectMutation.mutateAsync(response.user_id)
          await loginMutation.mutateAsync(formData)
        }
      }
    } catch (error) {
      console.error("Login error:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  return (
    <Container
      as="form"
      onSubmit={handleSubmit}
      h="100vh"
      maxW="sm"
      alignItems="stretch"
      justifyContent="center"
      gap={4}
      centerContent
    >
      <Image
        src={Logo}
        alt="FastAPI logo"
        height="auto"
        maxW="2xs"
        alignSelf="center"
        mb={4}
      />
      <Field invalid={!!errors.username} errorText={errors.username || !!error}>
        <InputGroup w="100%" startElement={<FiMail />}>
          <Input
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            placeholder="Email"
            type="email"
          />
        </InputGroup>
      </Field>
      <PasswordInput
        type="password"
        name="password"
        value={formData.password}
        onChange={handleChange}
        placeholder="Password"
        errors={errors}
        startElement={<FiLock />}
      />
      <Button variant="solid" type="submit" loading={isSubmitting} size="md">
        Log In
      </Button>
    </Container>
  )
}
