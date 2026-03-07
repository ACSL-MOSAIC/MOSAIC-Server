package com.gistacsl.mosaic.webrtc.dto;

import java.util.List;
import java.util.UUID;

import com.gistacsl.mosaic.robot.enumerate.RobotStatus;

public class WebRTCConnectionDto {

  public record Req(List<UUID> robotIds) {}

  public record RobotSession(UUID robotId, UUID rtcSessionId, RobotStatus status) {}

  public record Res(List<RobotSession> sessions) {}
}
