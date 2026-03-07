package com.gistacsl.mosaic.websocket.handler.robot.auth;

import reactor.core.publisher.Mono;

import com.gistacsl.mosaic.common.exception.CustomException;
import com.gistacsl.mosaic.repository.entity.RobotEntity;
import com.gistacsl.mosaic.websocket.handler.robot.dto.RobotAuthorizeWsDto;
import com.gistacsl.mosaic.websocket.session.RobotWsSession;

public interface MosaicBaseAuthHandler {
  Mono<Void> handleMessage(
      RobotAuthorizeWsDto<?> message, RobotEntity robot, RobotWsSession session)
      throws CustomException;
}
