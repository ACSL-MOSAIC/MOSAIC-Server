package com.gistacsl.mosaic.websocket.handler.user.dto;

import java.util.List;
import java.util.UUID;

public record UserSubscribeRobotStatusWsDto(
        List<UUID> robotIds
) {
}