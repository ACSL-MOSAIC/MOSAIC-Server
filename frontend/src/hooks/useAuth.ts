import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query"
import {useNavigate} from "@tanstack/react-router"
import {useState} from "react"

import type {ApiError} from "@/client"
import {OpenAPI} from "@/client/core/OpenAPI"
import {getUserMeApi} from "@/client/service/user.api.ts"
import type {UserDto} from "@/client/service/user.dto.ts"
import {handleError} from "@/utils"
import {
  disconnectApi,
  loginApi,
  signupApi,
} from "@/client/service/account.api.ts"
import type {AccountLoginReqDto} from "@/client/service/account.dto.ts"

const isLoggedIn = () => {
  return localStorage.getItem("access_token") !== null
}

const useAuth = () => {
  const [error, setError] = useState<string | null>(null)
  const [existingConnection, setExistingConnection] = useState<boolean>(false)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const {data: user} = useQuery<UserDto | null, Error>({
    queryKey: ["currentUser"],
    queryFn: getUserMeApi,
    enabled: isLoggedIn(),
  })

  const signUpMutation = useMutation({
    mutationFn: signupApi,
    onSuccess: () => {
      navigate({to: "/login"})
    },
    onError: (err: ApiError) => {
      handleError(err)
    },
    onSettled: () => {
      queryClient.invalidateQueries({queryKey: ["users"]})
    },
  })

  const login = async (data: AccountLoginReqDto) => {
    const response = await loginApi(data)

    if (response.existingConnection) {
      setExistingConnection(true)
      return response
    }

    localStorage.setItem("access_token", response.accessToken)
    // OpenAPI 설정에 토큰 설정
    OpenAPI.TOKEN = response.accessToken
    return response
  }

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: (response) => {
      if (response.existingConnection) {
        return
      }
      navigate({to: "/"})
    },
    onError: (err: ApiError) => {
      handleError(err)
    },
  })

  const disconnectMutation = useMutation({
    mutationFn: disconnectApi,
    onSuccess: () => {
      setExistingConnection(false)
      // 재로그인 시도
      const reqData = loginMutation.variables
      if (reqData) {
        // 잠시 대기 후 재로그인 시도
        setTimeout(() => {
          loginMutation.mutate(reqData)
        }, 1000)
      }
    },
    onError: (err: ApiError) => {
      handleError(err)
    },
  })

  const logout = async () => {
    localStorage.removeItem("access_token")
    // OpenAPI 설정에서 토큰 제거
    OpenAPI.TOKEN = undefined
    queryClient.clear()
    await navigate({to: "/login"})
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

export {isLoggedIn}
export default useAuth
