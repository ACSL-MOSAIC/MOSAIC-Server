import type { CancelablePromise } from "@/client";
import type {
  RobotSimpleTokenReqDto,
  RobotSimpleTokenResDto,
} from "@/client/service/robot-auth.dto.ts";

import { request as __request } from "@/client/core/request.ts";

export const generateSimpleTokenApi = (
  requestBody: RobotSimpleTokenReqDto,
): CancelablePromise<RobotSimpleTokenResDto> => {
  return __request({
    method: "POST",
    url: "/api/v1/robots/auth/simple-token",
    body: requestBody,
    mediaType: "application/json",
  });
};
