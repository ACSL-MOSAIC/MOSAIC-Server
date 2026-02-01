package com.gistacsl.mosaic.robot.dto;

import com.gistacsl.mosaic.robot.enumerate.RobotAuthType;
import com.gistacsl.mosaic.robot.enumerate.RobotStatus;

import java.util.UUID;

public class RobotInfoDto {

    public record Res(
            UUID id,
            String name,
            String description,
            RobotStatus status,
            RobotAuthType authType,
            UUID organizationId
    ) {
    }
}