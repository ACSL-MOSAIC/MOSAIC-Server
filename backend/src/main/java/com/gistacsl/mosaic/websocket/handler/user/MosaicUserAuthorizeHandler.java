package com.gistacsl.mosaic.websocket.handler.user;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.gistacsl.mosaic.common.GResponse;
import com.gistacsl.mosaic.common.enumerate.ResultCode;
import com.gistacsl.mosaic.common.exception.CustomException;
import com.gistacsl.mosaic.security.authentication.UserAuth;
import com.gistacsl.mosaic.security.jwt.JwtTokenService;
import com.gistacsl.mosaic.websocket.handler.WsMessageSender;
import com.gistacsl.mosaic.websocket.handler.dto.UserAuthorizeWsDto;
import com.gistacsl.mosaic.websocket.dto.WsMessage;
import com.gistacsl.mosaic.websocket.session.UserWsSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

@Slf4j
@Component
@RequiredArgsConstructor
public class MosaicUserAuthorizeHandler {
    public static final String TYPE_PREFIX = "authorize";
    private final ObjectMapper objectMapper;
    private final JwtTokenService jwtTokenService;
    private final WsMessageSender wsMessageSender;

    public Mono<Void> handleWsMessage(WsMessage<?> wsMessage, UserWsSession wsSession) {
        UserAuthorizeWsDto req = this.objectMapper.convertValue(wsMessage.getData(), UserAuthorizeWsDto.class);

        String accessToken = req.accessToken();
        if (null == accessToken) {
            this.handleAuthorizationFailed(wsSession, ResultCode.AUTHENTICATION_FAILED);
            return Mono.empty();
        }

        try {
            UserAuth userAuth = this.jwtTokenService.getUserAuthFromToken(accessToken);
            wsSession.setUserAuth(userAuth);
            wsSession.setIsAuthenticated(true);
            WsMessage<ResultCode> response = new WsMessage<>(TYPE_PREFIX + ".res", ResultCode.SUCCESS);
            this.wsMessageSender.sendWsMessageToUser(response, wsSession);
        } catch (CustomException e) {
            this.handleAuthorizationFailed(wsSession, e.getResultCode());
        } catch (Exception e) {
            this.handleAuthorizationFailed(wsSession, ResultCode.JWT_TOKEN_UNEXPECTED_ERROR);
        }
        return Mono.empty();
    }

    private void handleAuthorizationFailed(UserWsSession wsSession, ResultCode resultCode) {
        WsMessage<ResultCode> response = new WsMessage<>(TYPE_PREFIX + ".res", resultCode);
        try {
            this.wsMessageSender.sendWsMessageToUser(response, wsSession);
        } catch (CustomException e) {
            log.error("Failed to send error response to session: {}", wsSession.getSessionId(), e);
        }
    }
}
