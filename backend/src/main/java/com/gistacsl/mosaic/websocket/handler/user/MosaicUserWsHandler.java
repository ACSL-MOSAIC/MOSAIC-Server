package com.gistacsl.mosaic.websocket.handler.user;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.gistacsl.mosaic.common.enumerate.ResultCode;
import com.gistacsl.mosaic.common.exception.CustomException;
import com.gistacsl.mosaic.common.exception.ICustomException;
import com.gistacsl.mosaic.websocket.handler.WsMessageSender;
import com.gistacsl.mosaic.websocket.dto.WsMessage;
import com.gistacsl.mosaic.websocket.handler.robot.MosaicRobotWsHandler;
import com.gistacsl.mosaic.websocket.session.UserWsSession;
import com.gistacsl.mosaic.websocket.session.WsSessionManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.socket.WebSocketHandler;
import org.springframework.web.reactive.socket.WebSocketSession;
import reactor.core.publisher.Mono;
import reactor.core.publisher.Sinks;
import reactor.core.scheduler.Schedulers;

@Slf4j
@Component
@RequiredArgsConstructor
public class MosaicUserWsHandler implements WebSocketHandler {
    private final ObjectMapper objectMapper;
    private final MosaicUserAuthorizeHandler mosaicUserAuthorizeHandler;
    private final MosaicUserSignalingHandler mosaicUserSignalingHandler;

    private final WsMessageSender wsMessageSender;
    private final WsSessionManager wsSessionManager;

    public Mono<Void> handleWsMessageRequest(WsMessage<?> wsMessage, UserWsSession wsSession) {
        String prefix = wsMessage.getType().split("\\.")[0];
        return switch (prefix) {
            case "ping" -> Mono.empty();
            case MosaicUserAuthorizeHandler.TYPE_PREFIX ->
                    this.mosaicUserAuthorizeHandler.handleWsMessage(wsMessage, wsSession);
            case MosaicUserSignalingHandler.TYPE_PREFIX ->
                    this.mosaicUserSignalingHandler.handleWsMessage(wsMessage, wsSession);
            default -> Mono.error(new CustomException(ResultCode.UNKNOWN_WEBSOCKET_REQUEST_TYPE));
        };
    }

    @Override
    public Mono<Void> handle(WebSocketSession session) {
        UserWsSession wsSession = (UserWsSession) session;
        Sinks.Many<String> sinks = wsSession.getSinks();

        Mono<Void> output = wsSession.send(sinks.asFlux()
                .map(session::textMessage));
        Mono<Void> input = wsSession.receive()
                .<WsMessage<?>>handle((webSocketMessage, synchronousSink) -> {
                    try {
                        String payload = webSocketMessage.getPayloadAsText();
                        log.debug("Received WebSocket message: {}", payload);
                        WsMessage<?> wsMessageRequest = this.objectMapper.readValue(payload, WsMessage.class);
                        synchronousSink.next(wsMessageRequest);
                    } catch (Exception e) {
                        WsMessage<ResultCode> wsMessage = new WsMessage<>("unknown", ResultCode.INVALID_FORMAT);
                        this.handleError(wsMessage, e, wsSession);
                        // Continue processing - don't break the stream
                    }
                })
                .<WsMessage<?>>handle((wsMessage, synchronousSink) -> {
                    if (!wsMessage.getType().equals(MosaicUserAuthorizeHandler.TYPE_PREFIX) && false == wsSession.getIsAuthenticated()) {
                        WsMessage<ResultCode> newWsMessage = new WsMessage<>(wsMessage.getType(), ResultCode.AUTHENTICATION_FAILED);
                        this.handleError(newWsMessage, new CustomException(ResultCode.AUTHENTICATION_FAILED), wsSession);
                        // Continue processing - don't break the stream
                    } else {
                        synchronousSink.next(wsMessage);
                    }
                })
                .doOnNext(wsMessage -> this.handleWsMessageRequest(wsMessage, wsSession)
                        .onErrorResume(throwable -> {
                            // Handle error but don't break the WebSocket connection
                            if (throwable instanceof CustomException e) {
                                if (ResultCode.WEBSOCKET_SESSION_NOT_EXIST != e.getResultCode()) {
                                    WsMessage<ResultCode> newWsMessage = new WsMessage<>(wsMessage.getType(), e.getResultCode());
                                    this.handleError(newWsMessage, e, wsSession);
                                }
                            } else {
                                WsMessage<ResultCode> newWsMessage = new WsMessage<>(wsMessage.getType(), ResultCode.UNKNOWN_EXCEPTION_OCCURRED);
                                this.handleError(newWsMessage, new CustomException(ResultCode.UNKNOWN_EXCEPTION_OCCURRED, throwable), wsSession);
                            }
                            return Mono.empty();
                        })
                        .subscribeOn(Schedulers.boundedElastic())
                        .subscribe())
                .onErrorContinue((e, o) ->
                        {
                            WsMessage<?> wsMessage = (WsMessage<?>) o;
                            WsMessage<ResultCode> newWsMessage = new WsMessage<>(wsMessage.getType(), ResultCode.UNKNOWN_EXCEPTION_OCCURRED);
                            this.handleError(newWsMessage, new CustomException(ResultCode.UNKNOWN_EXCEPTION_OCCURRED, e), wsSession);
                        }
                )
                .then();

        return Mono.zip(output, input)
                .doOnTerminate(() -> this.wsSessionManager.removeUserSession(wsSession.getSessionId()))
                .then();
    }

    private void handleError(WsMessage<ResultCode> wsMessage, Exception e, UserWsSession wsSession) {
        log.error("WebSocket error occurred: {} for session: {}", e.getMessage(), wsSession.getSessionId(), e);

        try {
            this.wsMessageSender.sendWsMessageToUser(wsMessage, wsSession);
        } catch (CustomException e1) {
            log.error("Failed to send error response to session: {}", wsSession.getSessionId(), e1);
        }
    }
}
