import type {CancelablePromise, MessageDto} from "@/client"
import {request as __request} from "@/client/core/request.ts"
import type {
  UserDto,
  UserUpdateMeDto,
  UserUpdatePasswordMeDto,
} from "@/client/service/user.dto.ts"

/**
 * Read User Me
 * Get current user.
 * @returns UserPublic Successful Response
 * @throws ApiError
 */
export const getUserMeApi = (): CancelablePromise<UserDto> => {
  return __request({
    method: "GET",
    url: "/api/v1/users/me",
  })
}
/**
 * Update own user.
 * @param requestBody
 * @returns UserPublic Successful Response
 * @throws ApiError
 */
export const updateUserMeApi = (
  requestBody: UserUpdateMeDto,
): CancelablePromise<MessageDto> => {
  return __request({
    method: "PUT",
    url: "/api/v1/users/me",
    body: requestBody,
    mediaType: "application/json",
  })
}

/**
 * Update own password.
 * @param requestBody
 * @returns Message Successful Response
 * @throws ApiError
 */
export const updatePasswordMeApi = (
  requestBody: UserUpdatePasswordMeDto,
): CancelablePromise<MessageDto> => {
  return __request({
    method: "PUT",
    url: "/api/v1/users/me/password",
    body: requestBody,
    mediaType: "application/json",
  })
}
