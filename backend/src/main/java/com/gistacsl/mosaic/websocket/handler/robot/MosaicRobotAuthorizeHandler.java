package com.gistacsl.mosaic.websocket.handler.robot;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.gistacsl.mosaic.common.enumerate.ResultCode;
import com.gistacsl.mosaic.common.exception.CustomException;
import com.gistacsl.mosaic.common.exception.CustomRuntimeException;
import com.gistacsl.mosaic.robot.RobotService;
import com.gistacsl.mosaic.robot.enumerate.RobotAuthType;
import com.gistacsl.mosaic.security.jwt.JwtTokenService;
import com.gistacsl.mosaic.websocket.handler.WsMessageSender;
import com.gistacsl.mosaic.websocket.handler.robot.auth.MosaicBaseAuthHandler;
import com.gistacsl.mosaic.websocket.handler.robot.auth.impl.NoAuthorizationHandler;
import com.gistacsl.mosaic.websocket.handler.robot.dto.RobotAuthorizeWsDto;
import com.gistacsl.mosaic.websocket.session.RobotWsSession;
import com.gistacsl.mosaic.websocket.handler.user.dto.UserAuthorizeWsDto;
import com.gistacsl.mosaic.websocket.dto.WsMessage;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class MosaicRobotAuthorizeHandler {
    public static final String TYPE_PREFIX = "authorize";

    private final Map<RobotAuthType, MosaicBaseAuthHandler> authHandlerMap = new HashMap<>();

    private final ObjectMapper objectMapper;
    private final WsMessageSender wsMessageSender;

    private final RobotService robotService;

    @PostConstruct
    public void init() {
        this.authHandlerMap.put(RobotAuthType.NO_AUTHORIZATION, new NoAuthorizationHandler());
    }

    public Mono<Void> handleWsMessage(WsMessage<?> wsMessage, RobotWsSession wsSession) {
        RobotAuthorizeWsDto<?> req = this.objectMapper.convertValue(wsMessage.getData(), RobotAuthorizeWsDto.class);

        return this.robotService.getRobotEntity(req.getRobotId())
                .flatMap(robotEntity -> {
                    MosaicBaseAuthHandler authHandler = this.authHandlerMap.get(robotEntity.getAuthType());
                    if (authHandler == null) {
                        handleAuthorizationFailed(wsSession, ResultCode.UNKNOWN_ROBOT_AUTH_TYPE);
                        return Mono.empty();
                    }

                    try {
                        return authHandler.handleMessage(req, wsSession);
                    } catch (Exception e) {
                        log.error("Unknown exception occurred during authorization:", e);
                        handleAuthorizationFailed(wsSession, ResultCode.UNKNOWN_EXCEPTION_OCCURRED);
                        return Mono.empty();
                    }
                });
    }

    private void handleAuthorizationFailed(RobotWsSession wsSession, ResultCode resultCode) {
        WsMessage<ResultCode> response = new WsMessage<>(TYPE_PREFIX + ".res", resultCode);
        try {
            this.wsMessageSender.sendWsMessageToRobot(response, wsSession);
        } catch (CustomException e) {
            log.error("Failed to send error response to session: {}", wsSession.getSessionId(), e);
        }
    }
}
