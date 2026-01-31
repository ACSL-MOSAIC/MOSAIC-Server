package com.gistacsl.mosaic.robot.dto;

import java.util.UUID;

public class SimpleTokenDto {

    public record Req(
            UUID robotId
    ) {}

    public record Res(
            String token
    ) {}
}