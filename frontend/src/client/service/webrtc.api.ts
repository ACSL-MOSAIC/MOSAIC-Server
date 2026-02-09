import type {CancelablePromise} from "@/client"
import {request as __request} from "@/client/core/request.ts"
import type {
  IceServerDto,
  WebRTCConnectionReqDto,
  WebRTCConnectionResDto,
} from "@/client/service/webrtc.dto.ts"

/**
 * Create WebRTC Connection
 * Create a new WebRTC connection with specified robots
 * @param requestBody
 * @returns WebRTCConnectionResponseDto Successful Response
 * @throws ApiError
 */
export const createWebRTCConnectionApi = (
  requestBody: WebRTCConnectionReqDto,
): CancelablePromise<WebRTCConnectionResDto> => {
  return __request({
    method: "POST",
    url: "/api/v1/webrtc/connection",
    body: requestBody,
    mediaType: "application/json",
  })
}

/**
 * Get ICE Servers
 * Get list of ICE (STUN/TURN) servers for WebRTC connections
 * @returns IceServerDto[] Successful Response
 * @throws ApiError
 */
export const getIceServersApi = (): CancelablePromise<IceServerDto[]> => {
  return __request({
    method: "GET",
    url: "/api/v1/webrtc/ice-servers",
  })
}
