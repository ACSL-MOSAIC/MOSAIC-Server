package com.gistacsl.mosaic.robot.dto;

import java.util.UUID;

import com.gistacsl.mosaic.robot.enumerate.RobotAuthType;
import com.gistacsl.mosaic.robot.enumerate.RobotStatus;

public class RobotInfoDto {

  public record Res(
      UUID id,
      String name,
      String description,
      RobotStatus status,
      RobotAuthType authType,
      UUID organizationId,
      String connectorConfig) {}
}
