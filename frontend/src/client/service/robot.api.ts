import type {CancelablePromise, MessageDto, PageDto} from "@/client"
import {request as __request} from "@/client/core/request.ts"
import type {RobotInfoDto, RobotAddDto, RobotUpdateDto} from "./robot.dto.ts"

export const getRobotListApi = (
  limit?: number,
  skip?: number,
): CancelablePromise<PageDto<RobotInfoDto>> => {
  return __request({
    method: "GET",
    url: "/api/v1/robots",
    query: {
      limit: limit,
      skip: skip,
    },
  })
}

/**
 * Create new robot.
 * @param requestBody
 * @returns MessageDto Successful Response
 * @throws ApiError
 */
export const addRobotApi = (
  requestBody: RobotAddDto,
): CancelablePromise<MessageDto> => {
  return __request({
    method: "POST",
    url: "/api/v1/robots",
    body: requestBody,
    mediaType: "application/json",
  })
}

export const getRobotApi = (id: string): CancelablePromise<RobotInfoDto> => {
  return __request({
    method: "GET",
    url: "/api/v1/robots/{id}",
    path: {
      id: id,
    },
  })
}

/**
 * Update a robot.
 * @param id
 * @param requestBody
 * @returns RobotPublic Successful Response
 * @throws ApiError
 */
export const updateRobotApi = (
  id: string,
  requestBody: RobotUpdateDto,
): CancelablePromise<MessageDto> => {
  return __request({
    method: "PUT",
    url: "/api/v1/robots/{id}",
    path: {
      id: id,
    },
    body: requestBody,
    mediaType: "application/json",
  })
}

/**
 * Delete a robot.
 * @param id
 * @returns Message Successful Response
 * @throws ApiError
 */
export const deleteRobotApi = (id: string): CancelablePromise<MessageDto> => {
  return __request({
    method: "DELETE",
    url: "/api/v1/robots/{id}",
    path: {
      id: id,
    },
  })
}
