package com.gistacsl.mosaic.robot.dto;

import java.util.List;

public record RobotInfosPage(
        List<RobotInfo> data,
        Integer count
) {
}