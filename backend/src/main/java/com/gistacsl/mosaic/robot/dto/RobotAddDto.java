package com.gistacsl.mosaic.robot.dto;

import com.gistacsl.mosaic.robot.enumerate.RobotStatus;

public record RobotAddDto(
        String name,
        String description,
        RobotStatus status
) {
}