import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { useState } from "react"

import {
  type Body_users_login_access_token as AccessToken,
  type ApiError,
  UsersService,
  type UserPublic,
  type UserRegister,
} from "@/client"
import { handleError } from "@/utils"

const isLoggedIn = () => {
  return localStorage.getItem("access_token") !== null
}

const useAuth = () => {
  const [error, setError] = useState<string | null>(null)
  const [existingConnection, setExistingConnection] = useState<{ userId: string } | null>(null)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: user } = useQuery<UserPublic | null, Error>({
    queryKey: ["currentUser"],
    queryFn: UsersService.readUserMe,
    enabled: isLoggedIn(),
  })

  const signUpMutation = useMutation({
    mutationFn: (data: UserRegister) =>
      UsersService.registerUser({ requestBody: data }),

    onSuccess: () => {
      navigate({ to: "/login" })
    },
    onError: (err: ApiError) => {
      handleError(err)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] })
    },
  })

  const login = async (data: AccessToken) => {
    const response = await UsersService.loginAccessToken({
      formData: data,
    })
    
    if (response.existing_connection) {
      setExistingConnection({ userId: response.user_id })
      return response
    }
    
    localStorage.setItem("access_token", response.access_token)
    return response
  }

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: (response) => {
      if (response.existing_connection) {
        return
      }
      navigate({ to: "/" })
    },
    onError: (err: ApiError) => {
      handleError(err)
    },
  })

  const disconnectMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await UsersService.disconnectExistingSession({ 
        requestBody: { user_id: userId } 
      })
      return response
    },
    onSuccess: () => {
      setExistingConnection(null)
      // 재로그인 시도
      const formData = loginMutation.variables
      if (formData) {
        // 잠시 대기 후 재로그인 시도
        setTimeout(() => {
          loginMutation.mutate(formData)
        }, 1000)
      }
    },
    onError: (err: ApiError) => {
      handleError(err)
    },
  })

  const logout = () => {
    localStorage.removeItem("access_token")
    navigate({ to: "/login" })
  }

  return {
    signUpMutation,
    loginMutation,
    disconnectMutation,
    logout,
    user,
    error,
    existingConnection,
    resetError: () => setError(null),
  }
}

export { isLoggedIn }
export default useAuth
