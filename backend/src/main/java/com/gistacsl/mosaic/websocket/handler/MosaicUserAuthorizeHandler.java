package com.gistacsl.mosaic.websocket.handler;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.gistacsl.mosaic.common.GResponse;
import com.gistacsl.mosaic.common.enumerate.ResultCode;
import com.gistacsl.mosaic.common.exception.CustomException;
import com.gistacsl.mosaic.security.authentication.UserAuth;
import com.gistacsl.mosaic.security.jwt.JwtTokenService;
import com.gistacsl.mosaic.websocket.WsMessageSender;
import com.gistacsl.mosaic.websocket.dto.AuthorizeDto;
import com.gistacsl.mosaic.websocket.dto.WsMessageRequest;
import com.gistacsl.mosaic.websocket.session.UserWsSession;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.util.UUID;

@Component
@RequiredArgsConstructor
public class MosaicUserAuthorizeHandler {
    public static final String TYPE_PREFIX = "authorize";
    private final ObjectMapper objectMapper;
    private final JwtTokenService jwtTokenService;
    private final WsMessageSender wsMessageSender;

    public Mono<Void> handleWsMessage(WsMessageRequest wsMessageRequest, UserWsSession wsSession) {
        AuthorizeDto req = this.objectMapper.convertValue(wsMessageRequest.data(), AuthorizeDto.class);

        String accessToken = req.accessToken();

        if (null == accessToken) {
            return this.handleAuthorizationFailed(wsMessageRequest, wsSession, ResultCode.AUTHENTICATION_FAILED);
        }

        try {
            UserAuth userAuth = this.jwtTokenService.getUserAuthFromToken(accessToken);
            wsSession.setUserAuth(userAuth);
            wsSession.setIsAuthenticated(true);
            return wsMessageSender.convertAndSendWsGResponseToRobot(GResponse.toGResponse(ResultCode.SUCCESS), wsMessageRequest.type(), wsSession.getSessionId());
        } catch (CustomException e) {
            return handleAuthorizationFailed(wsMessageRequest, wsSession, e.getResultCode());
        } catch (Exception e) {
            return handleAuthorizationFailed(wsMessageRequest, wsSession, ResultCode.JWT_TOKEN_UNEXPECTED_ERROR);
        }
    }

    private Mono<Void> handleAuthorizationFailed(WsMessageRequest wsMessageRequest, UserWsSession wsSession, ResultCode resultCode) {
        GResponse<?> gResponse = GResponse.toGResponse(resultCode);
        return wsMessageSender.convertAndSendWsGResponseToRobot(gResponse, wsMessageRequest.type(), wsSession.getSessionId());
    }
}
