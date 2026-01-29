package com.gistacsl.mosaic.websocket.handler.dto;

import java.util.UUID;

public record SendSdpOfferWsDto(
        UUID rtcConnectionId,
        String sdpOffer
) {
}
