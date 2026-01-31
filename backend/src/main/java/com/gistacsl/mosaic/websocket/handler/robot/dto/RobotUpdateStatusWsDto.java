package com.gistacsl.mosaic.websocket.handler.robot.dto;

import com.gistacsl.mosaic.robot.enumerate.RobotStatus;

public record RobotUpdateStatusWsDto(
        RobotStatus status
) {
}
