package com.gistacsl.mosaic.websocket.handler.robot;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.gistacsl.mosaic.common.GResponse;
import com.gistacsl.mosaic.common.enumerate.ResultCode;
import com.gistacsl.mosaic.security.jwt.JwtTokenService;
import com.gistacsl.mosaic.websocket.handler.WsMessageSender;
import com.gistacsl.mosaic.websocket.session.RobotWsSession;
import com.gistacsl.mosaic.websocket.handler.dto.UserAuthorizeWsDto;
import com.gistacsl.mosaic.websocket.dto.WsMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.util.UUID;

@Component
@RequiredArgsConstructor
public class MosaicRobotAuthorizeHandler {
    public static final String TYPE_PREFIX = "authorize";
    private final ObjectMapper objectMapper;
    private final JwtTokenService jwtTokenService;
    private final WsMessageSender wsMessageSender;

    public Mono<Void> handleWsMessage(WsMessage<?> wsMessage, RobotWsSession wsSession) {
        UserAuthorizeWsDto req = this.objectMapper.convertValue(wsMessage.getData(), UserAuthorizeWsDto.class);

        String accessToken = req.accessToken();

        if (null == accessToken) {
            return this.handleAuthorizationFailed(wsMessage, wsSession, ResultCode.AUTHENTICATION_FAILED);
        }

        UUID userPk;
        try {
            userPk = UUID.randomUUID(); // TODO
        } catch (Exception e) {
            return handleAuthorizationFailed(wsMessage, wsSession, ResultCode.JWT_TOKEN_UNEXPECTED_ERROR);
        }
        wsSession.setRobotPk(userPk);
        wsSession.setIsAuthenticated(true);
        return Mono.empty();
    }

    private Mono<Void> handleAuthorizationFailed(WsMessage wsMessageRequest, RobotWsSession wsSession, ResultCode resultCode) {
        GResponse<?> gResponse = GResponse.toGResponse(resultCode);
        return Mono.empty();
    }
}
