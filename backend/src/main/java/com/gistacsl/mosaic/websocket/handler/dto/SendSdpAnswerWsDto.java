package com.gistacsl.mosaic.websocket.handler.dto;

import java.util.UUID;

public record SendSdpAnswerWsDto(
        UUID rtcConnectionId,
        String sdpAnswer
) {
}
