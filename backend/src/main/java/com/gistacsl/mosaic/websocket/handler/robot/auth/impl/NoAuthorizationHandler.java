package com.gistacsl.mosaic.websocket.handler.robot.auth.impl;

import com.gistacsl.mosaic.websocket.handler.robot.auth.MosaicBaseAuthHandler;
import com.gistacsl.mosaic.websocket.handler.robot.dto.RobotAuthorizeWsDto;
import com.gistacsl.mosaic.websocket.session.RobotWsSession;
import reactor.core.publisher.Mono;

public class NoAuthorizationHandler implements MosaicBaseAuthHandler {

    @Override
    public Mono<Void> handleMessage(RobotAuthorizeWsDto<?> message, RobotWsSession session) {
        session.authenticated(message);
        return Mono.empty();
    }
}
