package com.gistacsl.mosaic.websocket.handler.robot.auth;

import com.gistacsl.mosaic.common.exception.CustomException;
import com.gistacsl.mosaic.websocket.handler.robot.dto.RobotAuthorizeWsDto;
import com.gistacsl.mosaic.websocket.session.RobotWsSession;
import reactor.core.publisher.Mono;

public interface MosaicBaseAuthHandler {
    Mono<Void> handleMessage(RobotAuthorizeWsDto<?> message, RobotWsSession session) throws CustomException;
}
