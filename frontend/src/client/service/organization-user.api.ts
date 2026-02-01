import type {CancelablePromise, MessageDto, PageDto} from "@/client"
import {request as __request} from "@/client/core/request.ts"
import type {UserDto} from "./user.dto.ts"
import type {
  OrganizationCreateUserDto,
  OrganizationDeleteUserDto,
  OrganizationUpdateUserDto,
} from "./organization-user.dto.ts"

export const getOrganizationUserListApi = (
  skip?: number,
  limit?: number,
): CancelablePromise<PageDto<UserDto>> => {
  return __request({
    method: "GET",
    url: "/api/v1/organization/users",
    query: {
      skip: skip,
      limit: limit,
    },
  })
}

export const createOrganizationUserApi = (
  requestBody: OrganizationCreateUserDto,
): CancelablePromise<MessageDto> => {
  return __request({
    method: "POST",
    url: "/api/v1/organization/users",
    body: requestBody,
    mediaType: "application/json",
  })
}

export const updateOrganizationUserApi = (
  requestBody: OrganizationUpdateUserDto,
): CancelablePromise<MessageDto> => {
  return __request({
    method: "PUT",
    url: "/api/v1/organization/users",
    body: requestBody,
    mediaType: "application/json",
  })
}

export const deleteOrganizationUserApi = (
  requestBody: OrganizationDeleteUserDto,
): CancelablePromise<MessageDto> => {
  return __request({
    method: "DELETE",
    url: "/api/v1/organization/users",
    body: requestBody,
    mediaType: "application/json",
  })
}
