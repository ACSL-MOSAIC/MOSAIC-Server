package com.gistacsl.mosaic.robot.dto;

import com.gistacsl.mosaic.robot.enumerate.RobotStatus;

import java.util.UUID;

public record RobotInfo(
        UUID id,
        String name,
        String description,
        RobotStatus status,
        UUID ownerId
) {
}