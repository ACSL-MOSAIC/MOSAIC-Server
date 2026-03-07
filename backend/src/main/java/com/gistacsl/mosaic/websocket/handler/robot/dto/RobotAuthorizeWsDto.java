package com.gistacsl.mosaic.websocket.handler.robot.dto;

import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@AllArgsConstructor
public class RobotAuthorizeWsDto<T> {
  private UUID robotId;
  @Builder.Default private T data = null;
}
