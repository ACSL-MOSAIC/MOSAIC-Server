package com.gistacsl.mosaic.websocket.handler.robot.auth.impl;

import com.gistacsl.mosaic.repository.entity.RobotEntity;
import com.gistacsl.mosaic.robot.enumerate.RobotAuthType;
import com.gistacsl.mosaic.websocket.handler.robot.auth.MosaicBaseAuthHandler;
import com.gistacsl.mosaic.websocket.handler.robot.auth.RobotAuthHandler;
import com.gistacsl.mosaic.websocket.handler.robot.dto.RobotAuthorizeWsDto;
import com.gistacsl.mosaic.websocket.session.RobotWsSession;
import reactor.core.publisher.Mono;

@RobotAuthHandler(RobotAuthType.NO_AUTHORIZATION)
public class NoAuthorizationHandler implements MosaicBaseAuthHandler {

    @Override
    public Mono<Void> handleMessage(RobotAuthorizeWsDto<?> message, RobotEntity robot, RobotWsSession session) {
        session.authenticated(robot.getPk(), robot.getOrganizationFk());
        return Mono.empty();
    }
}
