package com.gistacsl.mosaic.websocket.handler.dto;

import com.gistacsl.mosaic.robot.enumerate.RobotStatus;

public record RobotUpdateStatusWsDto(
        RobotStatus status
) {
}
