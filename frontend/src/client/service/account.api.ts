import type {CancelablePromise, MessageDto} from "@/client"
import {request as __request} from "@/client/core/request.ts"
import type {
  AccountLoginReqDto,
  AccountLoginResDto,
  AccountSignupDto,
} from "./account.dto.ts"

export const loginApi = (
  requestBody: AccountLoginReqDto,
): CancelablePromise<AccountLoginResDto> => {
  return __request({
    method: "POST",
    url: "/api/v1/account/login/access-token",
    body: requestBody,
    mediaType: "application/json",
  })
}

export const disconnectApi = (): CancelablePromise<MessageDto> => {
  return __request({
    method: "POST",
    url: "/api/v1/users/disconnect",
  })
}

export const signupApi = (
  requestBody: AccountSignupDto,
): CancelablePromise<MessageDto> => {
  return __request({
    method: "POST",
    url: "/api/v1/account/signup",
    body: requestBody,
    mediaType: "application/json",
  })
}
