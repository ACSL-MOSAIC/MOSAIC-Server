package com.gistacsl.mosaic.robot.dto;

import com.gistacsl.mosaic.robot.enumerate.RobotStatus;

public class RobotAddDto {

    public record Req(
            String name,
            String description,
            RobotStatus status
    ) {}
}