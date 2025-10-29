// Note: the `PrivateService` is only available when generating the client
// for local environments
import { OpenAPI } from "@/client"
import { createUserPrivateApi } from "@/client/service/user.api.ts"

OpenAPI.BASE = `${process.env.VITE_API_URL}`

export const createUserApi = async ({
  email,
  password,
}: {
  email: string
  password: string
}) => {
  return createUserPrivateApi({
    email,
    password,
    is_verified: true,
    full_name: "Test User",
  })
}
