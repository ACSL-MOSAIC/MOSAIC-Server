import { type CancelablePromise, type Message, OpenAPI } from "@/client"
import { request as __request } from "@/client/core/request.ts"
import type {
  OccupancyMapPublic,
  OccupancyMapsPublic,
} from "./occupancy-map.dto.ts"

/**
 * Retrieve occupancy maps.
 * @param skip
 * @param limit
 * @returns OccupancyMapsPublic Successful Response
 * @throws ApiError
 */
export const readOccupancyMapsApi = (
  skip?: number,
  limit?: number,
): CancelablePromise<OccupancyMapsPublic> => {
  return __request(OpenAPI, {
    method: "GET",
    url: "/api/v1/occupancy_map/",
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
 * Get occupancy map by ID.
 * @param id
 * @returns OccupancyMapPublic Successful Response
 * @throws ApiError
 */
export const readOccupancyMapApi = (
  id: string,
): CancelablePromise<OccupancyMapPublic> => {
  return __request(OpenAPI, {
    method: "GET",
    url: "/api/v1/occupancy_map/{id}",
    path: {
      id: id,
    },
    errors: {
      422: "Validation Error",
    },
  })
}

/**
 * Create new occupancy map with file uploads.
 * @param name
 * @param pgmFile
 * @param yamlFile
 * @returns OccupancyMapPublic Successful Response
 * @throws ApiError
 */
export const createOccupancyMapApi = (
  name: string,
  pgmFile: File,
  yamlFile: File,
): CancelablePromise<OccupancyMapPublic> => {
  const formData = new FormData()
  formData.append("name", name)
  formData.append("pgm_file", pgmFile)
  formData.append("yaml_file", yamlFile)

  return __request(OpenAPI, {
    method: "POST",
    url: "/api/v1/occupancy_map/",
    body: formData,
    errors: {
      422: "Validation Error",
    },
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
  return __request(OpenAPI, {
    method: "GET",
    url: "/api/v1/occupancy_map/{id}/download",
    path: {
      id: id,
    },
    responseType: "blob",
    errors: {
      422: "Validation Error",
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
): CancelablePromise<Message> => {
  return __request(OpenAPI, {
    method: "DELETE",
    url: "/api/v1/occupancy_map/{id}",
    path: {
      id: id,
    },
    errors: {
      422: "Validation Error",
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
  return __request(OpenAPI, {
    method: "GET",
    url: "/api/v1/occupancy_map/{id}/pgm",
    path: {
      id: id,
    },
    responseType: "blob",
    errors: {
      422: "Validation Error",
    },
  })
}

/**
 * Get YAML file of occupancy map.
 * @param id
 * @returns Blob Successful Response
 * @throws ApiError
 */
export const getOccupancyMapYamlApi = (id: string): CancelablePromise<Blob> => {
  return __request(OpenAPI, {
    method: "GET",
    url: "/api/v1/occupancy_map/{id}/yaml",
    path: {
      id: id,
    },
    responseType: "blob",
    errors: {
      422: "Validation Error",
    },
  })
}
