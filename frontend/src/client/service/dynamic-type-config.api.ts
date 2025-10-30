import type { CancelablePromise } from "@/client"
import { OpenAPI } from "@/client"
import { request as __request } from "../core/request"
import type {
  DynamicTypeConfigCreate,
  DynamicTypeConfigPublic,
} from "./dynamic-type-config.dto.ts"

/**
 * Read Dynamic Type Config
 * 현재 사용자의 동적 타입 설정 조회
 * @returns DynamicTypeConfigPublic Successful Response
 * @throws ApiError
 */
export const readDynamicTypeConfigApi =
  (): CancelablePromise<DynamicTypeConfigPublic> => {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/v1/dynamic-type-config/",
    })
  }

/**
 * 동적 타입 설정 upsert (있으면 업데이트, 없으면 생성)
 * @param requestBody
 * @returns DynamicTypeConfigPublic Successful Response
 * @throws ApiError
 */
export const upsertDynamicTypeConfigApi = (
  requestBody: DynamicTypeConfigCreate,
): CancelablePromise<DynamicTypeConfigPublic> => {
  return __request(OpenAPI, {
    method: "POST",
    url: "/api/v1/dynamic-type-config/",
    body: requestBody,
    mediaType: "application/json",
    errors: {
      422: "Validation Error",
    },
  })
}
