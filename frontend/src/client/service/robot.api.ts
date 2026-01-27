import type { CancelablePromise, Message } from "@/client"
import { request as __request } from "@/client/core/request.ts"
import type { RobotCreate, RobotUpdate, RobotsPublic } from "./robot.dto.ts"

/**
 * Retrieve robots.
 * @param skip
 * @param limit
 * @returns RobotsPublic Successful Response
 * @throws ApiError
 */
export const readRobotsApi = (
  limit?: number,
  skip?: number,
): CancelablePromise<RobotsPublic> => {
  return __request({
    method: "GET",
    url: "/api/v1/robots/",
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
 * Create new robot.
 * @param requestBody
 * @returns RobotPublic Successful Response
 * @throws ApiError
 */
export const createRobotApi = (
  requestBody: RobotCreate,
): CancelablePromise<RobotsPublic> => {
  return __request({
    method: "POST",
    url: "/api/v1/robots/",
    body: requestBody,
    mediaType: "application/json",
    errors: {
      422: "Validation Error",
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
  requestBody: RobotUpdate,
): CancelablePromise<RobotsPublic> => {
  return __request({
    method: "PUT",
    url: "/api/v1/robots/{id}",
    path: {
      id: id,
    },
    body: requestBody,
    mediaType: "application/json",
    errors: {
      422: "Validation Error",
    },
  })
}

/**
 * Delete a robot.
 * @param id
 * @returns Message Successful Response
 * @throws ApiError
 */
export const deleteRobotApi = (id: string): CancelablePromise<Message> => {
  return __request({
    method: "DELETE",
    url: "/api/v1/robots/{id}",
    path: {
      id: id,
    },
    errors: {
      422: "Validation Error",
    },
  })
}
