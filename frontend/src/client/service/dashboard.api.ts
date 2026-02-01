import type {CancelablePromise} from "@/client/core/CancelablePromise.ts"
import {request as __request} from "@/client/core/request.ts"
import type {
  TabAddDto,
  TabConfigDto, TabConfigUpdateDto,
  TabInfoDto,
  TabNameUpdateDto
} from "./dashboard.dto.ts"

/**
 * Read Tab List
 * @returns TabInfoDto[] Successful Response
 * @throws ApiError
 */
export const getTabListApi = (): CancelablePromise<TabInfoDto[]> => {
  return __request({
    method: "GET",
    url: "/api/v1/dashboard",
  })
}

export const addTabApi = (tabAddDto: TabAddDto): CancelablePromise<void> => {
  return __request({
    method: "POST",
    url: "/api/v1/dashboard",
    body: tabAddDto,
    mediaType: "application/json",
  })
}

export const getTabConfigApi = (tabId: string): CancelablePromise<TabConfigDto> => {
  return __request({
    method: "GET",
    url: `/api/v1/dashboard/${tabId}`,
  })
}

export const updateTabNameApi = (tabId: string, tabNameUpdateDto: TabNameUpdateDto): CancelablePromise<void> => {
  return __request({
    method: "PUT",
    url: `/api/v1/dashboard/${tabId}`,
    body: tabNameUpdateDto,
    mediaType: "application/json",
  })
}

export const updateTabConfigApi = (tabId: string, tabConfigUpdateDto: TabConfigUpdateDto): CancelablePromise<void> => {
  return __request({
    method: "PUT",
    url: `/api/v1/dashboard/${tabId}`,
    body: tabConfigUpdateDto,
    mediaType: "application/json",
  })
}

export const deleteTabApi = (tabId: string): CancelablePromise<void> => {
  return __request({
    method: "DELETE",
    url: `/api/v1/dashboard/${tabId}`,
  })
}
