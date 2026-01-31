package com.gistacsl.mosaic.websocket.handler.robot.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
public class RobotAuthorizeWsDto<T> {
    private UUID robotId;
    @Builder.Default
    private T data = null;
}
