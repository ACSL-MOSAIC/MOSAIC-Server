package com.gistacsl.mosaic.websocket.dto;

public record WsMessageRequest(
        String type,
        Object data
) {
}
