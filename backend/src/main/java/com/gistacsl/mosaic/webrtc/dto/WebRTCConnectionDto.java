package com.gistacsl.mosaic.webrtc.dto;

import java.util.List;
import java.util.UUID;

public class WebRTCConnectionDto {

    public record Req(
            List<UUID> robotIds
    ) {
    }

    public record RobotSession(
            UUID robotId,
            UUID rtcSessionId
    ) {
    }

    public record Res(
            List<RobotSession> sessions
    ) {
    }
}
