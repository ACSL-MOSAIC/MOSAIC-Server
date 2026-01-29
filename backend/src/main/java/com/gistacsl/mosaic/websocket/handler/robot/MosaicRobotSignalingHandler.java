package com.gistacsl.mosaic.websocket.handler.robot;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.gistacsl.mosaic.common.GResponse;
import com.gistacsl.mosaic.common.enumerate.ResultCode;
import com.gistacsl.mosaic.websocket.dto.AuthorizeDto;
import com.gistacsl.mosaic.websocket.dto.WsMessageRequest;
import com.gistacsl.mosaic.websocket.handler.WsMessageSender;
import com.gistacsl.mosaic.websocket.session.RobotWsSession;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.util.UUID;

@Component
@RequiredArgsConstructor
public class MosaicRobotSignalingHandler {
    public static final String TYPE_PREFIX = "signaling";
    private final ObjectMapper objectMapper;
    private final WsMessageSender wsMessageSender;

    public Mono<Void> handleWsMessage(WsMessageRequest wsMessageRequest, RobotWsSession wsSession) {
        AuthorizeDto req = this.objectMapper.convertValue(wsMessageRequest.data(), AuthorizeDto.class);

        String accessToken = req.accessToken();

        if (null == accessToken) {
            return this.handleAuthorizationFailed(wsMessageRequest, wsSession, ResultCode.AUTHENTICATION_FAILED);
        }

        UUID userPk;
        try {
            userPk = UUID.randomUUID(); // TODO
//        } catch (V2GExpiredJwtException e) {
//            return handleAuthorizationFailed(wsMessageRequest, wsSession, ResultCode.JWT_TOKEN_EXPIRED);
//        } catch (V2GSignatureException e) {
//            return handleAuthorizationFailed(wsMessageRequest, wsSession, ResultCode.JWT_TOKEN_SIGNATURE_FAILED);
//        } catch (V2GInvalidTokenException e) {
//            return handleAuthorizationFailed(wsMessageRequest, wsSession, ResultCode.JWT_TOKEN_DECRYPTING_FAILED);
//        } catch (V2GVerifyFailedException e) {
//            return handleAuthorizationFailed(wsMessageRequest, wsSession, ResultCode.JWT_TOKEN_VERIFY_FAILED);
        } catch (Exception e) {
            return handleAuthorizationFailed(wsMessageRequest, wsSession, ResultCode.JWT_TOKEN_UNEXPECTED_ERROR);
        }
        wsSession.setRobotPk(userPk);
        wsSession.setIsAuthenticated(true);

        return wsMessageSender.convertAndSendWsGResponseToRobot(GResponse.toGResponse(ResultCode.SUCCESS), wsMessageRequest.type(), wsSession.getSessionId());
    }

    private Mono<Void> handleAuthorizationFailed(WsMessageRequest wsMessageRequest, RobotWsSession wsSession, ResultCode resultCode) {
        GResponse<?> gResponse = GResponse.toGResponse(resultCode);
        return wsMessageSender.convertAndSendWsGResponseToRobot(gResponse, wsMessageRequest.type(), wsSession.getSessionId());
    }
}
