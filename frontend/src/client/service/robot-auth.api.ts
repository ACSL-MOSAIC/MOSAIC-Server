import type {CancelablePromise} from "@/client"
import {request as __request} from "@/client/core/request.ts"
import type {
  RobotSimpleTokenReqDto,
  RobotSimpleTokenResDto,
} from "@/client/service/robot-auth.dto.ts"

export const generateSimpleTokenApi = (
  requestBody: RobotSimpleTokenReqDto,
): CancelablePromise<RobotSimpleTokenResDto> => {
  return __request({
    method: "POST",
    url: "/api/v1/robots/auth/simple-token",
    body: requestBody,
    mediaType: "application/json",
  })
}
