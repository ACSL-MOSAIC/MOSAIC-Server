package com.gistacsl.mosaic.websocket.handler.user.dto;

import java.util.UUID;

import com.gistacsl.mosaic.robot.enumerate.RobotStatus;

public record UserUpdateRobotStatusWsDto(UUID robotId, RobotStatus status) {}
