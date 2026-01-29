package com.gistacsl.mosaic.websocket.handler.dto;

import com.gistacsl.mosaic.robot.enumerate.RobotStatus;

import java.util.UUID;

public record UserUpdateRobotStatusWsDto(
        UUID robotId,
        RobotStatus status
) {
}
