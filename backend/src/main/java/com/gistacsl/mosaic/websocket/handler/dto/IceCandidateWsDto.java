package com.gistacsl.mosaic.websocket.handler.dto;

public record IceCandidateWsDto(
        String candidate,
        String sdpMid,
        String sdpMLineIndex
) {
}
