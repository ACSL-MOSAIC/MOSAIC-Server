import type { CancelablePromise } from "@/client/core/CancelablePromise.ts"
import { request as __request } from "@/client/core/request.ts"
import type { DashboardCreate, DashboardPublic } from "./dashboard.dto.ts"

/**
 * Read Dashboard
 * 현재 사용자의 대시보드 설정 조회
 * @returns DashboardPublic Successful Response
 * @throws ApiError
 */
export const readDashboardApi = (): CancelablePromise<DashboardPublic> => {
  return __request({
    method: "GET",
    url: "/api/v1/dashboard/",
  })
}

/**
 * 대시보드 설정 upsert (있으면 업데이트, 없으면 생성)
 * @param requestBody
 * @returns DashboardPublic Successful Response
 * @throws ApiError
 */
export const upsertDashboardApi = (
  requestBody: DashboardCreate,
): CancelablePromise<DashboardPublic> => {
  return __request({
    method: "POST",
    url: "/api/v1/dashboard/",
    body: requestBody,
    mediaType: "application/json",
    errors: {
      422: "Validation Error",
    },
  })
}
