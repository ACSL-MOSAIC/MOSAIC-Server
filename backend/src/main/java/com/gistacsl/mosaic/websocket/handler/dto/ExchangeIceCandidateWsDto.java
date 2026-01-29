package com.gistacsl.mosaic.websocket.handler.dto;

import java.util.UUID;

public record ExchangeIceCandidateWsDto(
        UUID rtcConnectionId,
        IceCandidateWsDto iceCandidate
) {
}
