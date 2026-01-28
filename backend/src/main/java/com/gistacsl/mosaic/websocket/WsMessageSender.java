package com.gistacsl.mosaic.websocket;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.gistacsl.mosaic.common.GResponse;
import com.gistacsl.mosaic.common.enumerate.ResultCode;
import com.gistacsl.mosaic.common.exception.CustomException;
import com.gistacsl.mosaic.websocket.dto.WsGResponse;
import com.gistacsl.mosaic.websocket.session.RobotWsSession;
import com.gistacsl.mosaic.websocket.session.UserWsSession;
import com.gistacsl.mosaic.websocket.session.WsSessionManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class WsMessageSender {
    private final ObjectMapper objectMapper;
    private final WsSessionManager wsSessionManager;

    public <R> Mono<Void> convertAndSendWsGResponseToRobot(GResponse<R> gResponse, String requestType, UUID targetSessionId) {
        return Mono.just(this.gResponseToWsGResponse(requestType, gResponse))
                .flatMap(wsGResponse -> sendWsGResponseToRobot(wsGResponse, targetSessionId));
    }

    public <R> Mono<Void> sendWsGResponseToRobot(WsGResponse<R> wsGResponse, UUID targetSessionId) {
        log.debug("Sending WebSocket response to session: {}", targetSessionId);
        return this.wsGResponseToWsMessage(wsGResponse)
                .flatMap((wsMessage) -> {
                    Optional<RobotWsSession> optionalWsSession = this.wsSessionManager.getRobotSession(targetSessionId);
                    if (optionalWsSession.isEmpty()) {
                        log.warn("WebSocket session not found: {}", targetSessionId);
                        return Mono.error(new CustomException(ResultCode.WEBSOCKET_SESSION_NOT_EXIST));
                    } else {
                        RobotWsSession wsSession = optionalWsSession.get();
                        wsSession.getSinks().tryEmitNext(wsMessage);
                        log.debug("WebSocket message sent successfully to session: {}", targetSessionId);
                    }
                    return Mono.empty();
                });
    }

    public <R> Mono<Void> convertAndSendWsGResponseToUser(GResponse<R> gResponse, String requestType, UUID targetSessionId) {
        return Mono.just(this.gResponseToWsGResponse(requestType, gResponse))
                .flatMap(wsGResponse -> sendWsGResponseToUser(wsGResponse, targetSessionId));
    }

    public <R> Mono<Void> sendWsGResponseToUser(WsGResponse<R> wsGResponse, UUID targetSessionId) {
        log.debug("Sending WebSocket response to session: {}", targetSessionId);
        return this.wsGResponseToWsMessage(wsGResponse)
                .flatMap((wsMessage) -> {
                    Optional<UserWsSession> optionalWsSession = this.wsSessionManager.getUserSession(targetSessionId);
                    if (optionalWsSession.isEmpty()) {
                        log.warn("WebSocket session not found: {}", targetSessionId);
                        return Mono.error(new CustomException(ResultCode.WEBSOCKET_SESSION_NOT_EXIST));
                    } else {
                        UserWsSession wsSession = optionalWsSession.get();
                        wsSession.getSinks().tryEmitNext(wsMessage);
                        log.debug("WebSocket message sent successfully to session: {}", targetSessionId);
                    }
                    return Mono.empty();
                });
    }

    private <R> WsGResponse<R> gResponseToWsGResponse(String type, GResponse<R> gResponse) {
        return WsGResponse.<R>builder()
                .type(type + ".res")
                .resultCode(gResponse.getResultCode())
                .resultData(gResponse.getResultData())
                .build();
    }

    private Mono<String> wsGResponseToWsMessage(WsGResponse<?> wsGResponse) {
        try {
            String json = this.objectMapper.writeValueAsString(wsGResponse);
            log.debug("Serialized WebSocket response: {}", json);
            return Mono.just(json);
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize WsGResponse to JSON: {}", wsGResponse, e);
            return Mono.error(new CustomException(ResultCode.UNKNOWN_EXCEPTION_OCCURRED, e));
        }
    }

}
