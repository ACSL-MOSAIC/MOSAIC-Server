import type {CancelablePromise, MessageDto} from "@/client"
import {request as __request} from "@/client/core/request.ts"
import type {
  Body_users_login_access_token,
  DisconnectRequest,
  LoginResponse,
  NewPassword,
  PrivateUserCreate,
  UpdatePassword,
  UserCreate,
  UserPublic,
  UserRegister,
  UserUpdate,
  UsersPublic,
} from "./user.dto.ts"

/**
 * Create a new user.
 * @param requestBody
 * @returns UserPublic Successful Response
 * @throws ApiError
 */
export const createUserPrivateApi = (
  requestBody: PrivateUserCreate,
): CancelablePromise<UserPublic> => {
  return __request({
    method: "POST",
    url: "/api/v1/private/users",
    body: requestBody,
    mediaType: "application/json",
    errors: {
      422: "Validation Error",
    },
  })
}

/**
 * Retrieve users.
 * @param skip
 * @param limit
 * @returns UsersPublic Successful Response
 * @throws ApiError
 */
export const readUsersApi = (
  limit?: number,
  skip?: number,
): CancelablePromise<UsersPublic> => {
  return __request({
    method: "GET",
    url: "/api/v1/users",
    query: {
      skip: skip,
      limit: limit,
    },
    errors: {
      422: "Validation Error",
    },
  })
}

/**
 * Create User
 * @param requestBody
 * @returns UserPublic Successful Response
 * @throws ApiError
 */
export const createUserApi = (
  requestBody: UserCreate,
): CancelablePromise<UserPublic> => {
  return __request({
    method: "POST",
    url: "/api/v1/users",
    body: requestBody,
    mediaType: "application/json",
    errors: {
      422: "Validation Error",
    },
  })
}

/**
 * Read User Me
 * Get current user.
 * @returns UserPublic Successful Response
 * @throws ApiError
 */
export const readUserMeApi = (): CancelablePromise<UserPublic> => {
  return __request({
    method: "GET",
    url: "/api/v1/users/me",
  })
}

/**
 * Delete User Me
 * Delete own user.
 * @returns Message Successful Response
 * @throws ApiError
 */
export const deleteUserMeApi = (): CancelablePromise<MessageDto> => {
  return __request({
    method: "DELETE",
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
  requestBody: UserUpdate,
): CancelablePromise<UserPublic> => {
  return __request({
    method: "PATCH",
    url: "/api/v1/users/me",
    body: requestBody,
    mediaType: "application/json",
    errors: {
      422: "Validation Error",
    },
  })
}

/**
 * Update own password.
 * @param requestBody
 * @returns Message Successful Response
 * @throws ApiError
 */
export const updatePasswordMeApi = (
  requestBody: UpdatePassword,
): CancelablePromise<MessageDto> => {
  return __request({
    method: "PATCH",
    url: "/api/v1/users/me/password",
    body: requestBody,
    mediaType: "application/json",
    errors: {
      422: "Validation Error",
    },
  })
}

/**
 * Create new user without the need to be logged in.
 * @param requestBody
 * @returns UserPublic Successful Response
 * @throws ApiError
 */
export const registerUserApi = (
  requestBody: UserRegister,
): CancelablePromise<UserPublic> => {
  return __request({
    method: "POST",
    url: "/api/v1/users/signup",
    body: requestBody,
    mediaType: "application/json",
    errors: {
      422: "Validation Error",
    },
  })
}

/**
 * Update User
 * @param userId
 * @param requestBody
 * @returns UserPublic Successful Response
 * @throws ApiError
 */
export const updateUserApi = (
  userId: string,
  requestBody: UserUpdate,
): CancelablePromise<UserPublic> => {
  return __request({
    method: "PATCH",
    url: "/api/v1/users/{user_id}",
    path: {
      user_id: userId,
    },
    body: requestBody,
    mediaType: "application/json",
    errors: {
      422: "Validation Error",
    },
  })
}

/**
 * Delete User
 * @param userId
 * @returns Message Successful Response
 * @throws ApiError
 */
export const deleteUserApi = (userId: string): CancelablePromise<MessageDto> => {
  return __request({
    method: "DELETE",
    url: "/api/v1/users/{user_id}",
    path: {
      user_id: userId,
    },
    errors: {
      422: "Validation Error",
    },
  })
}

/**
 * Login Access Token
 * @param requestBody
 * @returns LoginResponse Successful Response
 * @throws ApiError
 */
export const loginAccessTokenApi = (
  requestBody: Body_users_login_access_token,
): CancelablePromise<LoginResponse> => {
  return __request({
    method: "POST",
    url: "/api/v1/account/login/access-token",
    body: requestBody,
    mediaType: "application/json",
    errors: {
      422: "Validation Error",
    },
  })
}

/**
 * Disconnect existing WebSocket connection and force logout
 * @param requestBody
 * @returns Message Successful Response
 * @throws ApiError
 */
export const disconnectExistingSessionApi = (
  requestBody: DisconnectRequest,
): CancelablePromise<MessageDto> => {
  return __request({
    method: "POST",
    url: "/api/v1/users/disconnect",
    body: requestBody,
    mediaType: "application/json",
    errors: {
      422: "Validation Error",
    },
  })
}

/**
 * Reset Password
 * @param data The data for the request.
 * @param requestBody
 * @returns Message Successful Response
 * @throws ApiError
 */
export const resetPasswordApi = (
  requestBody: NewPassword,
): CancelablePromise<MessageDto> => {
  return __request({
    method: "POST",
    url: "/api/v1/users/reset-password",
    body: requestBody,
    mediaType: "application/json",
    errors: {
      422: "Validation Error",
    },
  })
}
