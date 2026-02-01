import type {CancelablePromise, MessageDto, PageDto} from "@/client"
import {request as __request} from "@/client/core/request.ts"
import type {
  OccupancyMapDto
} from "./occupancy-map.dto.ts"

/**
 * Retrieve occupancy maps.
 * @param skip
 * @param limit
 * @returns OccupancyMapsPublic Successful Response
 * @throws ApiError
 */
export const getOccupancyMapsListApi = (
  skip?: number,
  limit?: number,
): CancelablePromise<PageDto<OccupancyMapDto>> => {
  return __request({
    method: "GET",
    url: "/api/v1/occupancy_map",
    query: {
      skip: skip,
      limit: limit,
    },
  })
}

/**
 * Create new occupancy map with file uploads.
 * @param name
 * @param pgmFile
 * @param yamlFile
 * @returns MessageDto Successful Response
 * @throws ApiError
 */
export const createOccupancyMapApi = (
  name: string,
  pgmFile: File,
  yamlFile: File,
): CancelablePromise<MessageDto> => {
  const formData = new FormData()
  formData.append("name", name)
  formData.append("pgm_file", pgmFile)
  formData.append("yaml_file", yamlFile)

  return __request({
    method: "POST",
    url: "/api/v1/occupancy_map",
    body: formData,
  })
}

/**
 * Get occupancy map by ID.
 * @param id
 * @returns OccupancyMapDto Successful Response
 * @throws ApiError
 */
export const getOccupancyMapApi = (
  id: string,
): CancelablePromise<OccupancyMapDto> => {
  return __request({
    method: "GET",
    url: "/api/v1/occupancy_map/{id}",
    path: {
      id: id,
    },
  })
}

/**
 * Delete an occupancy map.
 * @param id
 * @returns Message Successful Response
 * @throws ApiError
 */
export const deleteOccupancyMapApi = (
  id: string,
): CancelablePromise<MessageDto> => {
  return __request({
    method: "DELETE",
    url: "/api/v1/occupancy_map/{id}",
    path: {
      id: id,
    },
  })
}

/**
 * Get PGM file of occupancy map.
 * @param id
 * @returns Blob Successful Response
 * @throws ApiError
 */
export const getOccupancyMapPgmApi = (id: string): CancelablePromise<Blob> => {
  return __request({
    method: "GET",
    url: "/api/v1/occupancy_map/{id}/pgm",
    path: {
      id: id,
    },
    responseType: "blob",
  })
}

/**
 * Get YAML file of occupancy map.
 * @param id
 * @returns Blob Successful Response
 * @throws ApiError
 */
export const getOccupancyMapYamlApi = (id: string): CancelablePromise<Blob> => {
  return __request({
    method: "GET",
    url: "/api/v1/occupancy_map/{id}/yaml",
    path: {
      id: id,
    },
    responseType: "blob",
  })
}

/**
 * Download occupancy map as ZIP file.
 * @param id
 * @returns Blob Successful Response
 * @throws ApiError
 */
export const downloadOccupancyMapApi = (
  id: string,
): CancelablePromise<Blob> => {
  return __request({
    method: "GET",
    url: "/api/v1/occupancy_map/{id}/download",
    path: {
      id: id,
    },
    responseType: "blob",
  })
}
