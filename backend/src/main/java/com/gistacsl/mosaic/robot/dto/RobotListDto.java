package com.gistacsl.mosaic.robot.dto;

import java.util.List;

public class RobotListDto {

    public record Res(
            List<RobotInfoDto.Res> data,
            Integer count
    ) {}
}