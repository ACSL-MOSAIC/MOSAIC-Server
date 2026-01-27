package com.gistacsl.mosaic.websocket.handler;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.gistacsl.mosaic.common.enumerate.ResultCode;
import com.gistacsl.mosaic.common.exception.CustomException;
import com.gistacsl.mosaic.common.exception.ICustomException;
import com.gistacsl.mosaic.websocket.WsMessageSender;
import com.gistacsl.mosaic.websocket.WsSession;
import com.gistacsl.mosaic.websocket.WsSessionManager;
import com.gistacsl.mosaic.websocket.dto.WsGResponse;
import com.gistacsl.mosaic.websocket.dto.WsMessageRequest;
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
public class MosaicRobotWsHandler implements WebSocketHandler {
    private final ObjectMapper objectMapper;
    private final MosaicRobotAuthorizeHandler mosaicRobotAuthorizeHandler;

    private final WsMessageSender wsMessageSender;
    private final WsSessionManager wsSessionManager;

    @Override
    public Mono<Void> handle(WebSocketSession session) {
        WsSession wsSession = (WsSession) session;
        Sinks.Many<String> sinks = wsSession.getSinks();

        Mono<Void> output = wsSession.send(sinks.asFlux()
                .map(session::textMessage));
        Mono<Void> input = wsSession.receive()
                .<WsMessageRequest>handle((webSocketMessage, synchronousSink) -> {
                    try {
                        String payload = webSocketMessage.getPayloadAsText();
                        log.debug("Received WebSocket message: {}", payload);
                        WsMessageRequest wsMessageRequest = this.objectMapper.readValue(payload, WsMessageRequest.class);
                        synchronousSink.next(wsMessageRequest);
                    } catch (Exception e) {
                        log.error("Failed to parse WebSocket message for session: {}", wsSession.getSessionId(), e);
                        WsMessageRequest wsMessageRequest = new WsMessageRequest("unknown", null);
                        this.handleError(wsMessageRequest, new CustomException(ResultCode.INVALID_FORMAT, e), wsSession);
                        // Continue processing - don't break the stream
                    }
                })
                .<WsMessageRequest>handle((wsMessageRequest, synchronousSink) -> {
                    if (!wsMessageRequest.type().equals(MosaicRobotAuthorizeHandler.TYPE_PREFIX) && false == wsSession.getIsAuthenticated()) {
                        this.handleError(wsMessageRequest, new CustomException(ResultCode.AUTHENTICATION_FAILED), wsSession);
                        // Continue processing - don't break the stream
                    } else {
                        synchronousSink.next(wsMessageRequest);
                    }
                })
                .doOnNext(wsMessageRequest -> {
                    String prefix = wsMessageRequest.type().split("\\.")[0];
                    Mono<Void> handleMono = switch (prefix) {
                        case "ping" -> Mono.empty();
                        case MosaicRobotAuthorizeHandler.TYPE_PREFIX ->
                                this.mosaicRobotAuthorizeHandler.handleWsMessage(wsMessageRequest, wsSession);
                        default -> Mono.error(new CustomException(ResultCode.UNKNOWN_WEBSOCKET_REQUEST_TYPE));
                    };
                    handleMono
                            .onErrorResume(throwable -> {
                                // Handle error but don't break the WebSocket connection
                                if (throwable instanceof CustomException e) {
                                    if (ResultCode.WEBSOCKET_SESSION_NOT_EXIST != e.getResultCode()) {
                                        MosaicRobotWsHandler.this.handleError(wsMessageRequest, e, wsSession);
                                    }
                                } else {
                                    MosaicRobotWsHandler.this.handleError(wsMessageRequest, new CustomException(ResultCode.UNKNOWN_EXCEPTION_OCCURRED, throwable), wsSession);
                                }
                                return Mono.empty();
                            })
                            .subscribeOn(Schedulers.boundedElastic())
                            .subscribe();
                })
                .onErrorContinue((e, o) ->
                        this.handleError((WsMessageRequest) o, new CustomException(ResultCode.UNKNOWN_EXCEPTION_OCCURRED, e), wsSession)
                )
                .then();

        return Mono.zip(output, input)
                .doOnTerminate(() -> this.wsSessionManager.removeSession(wsSession.getSessionId()))
                .then();
    }

    private void handleError(WsMessageRequest wsMessageRequestWithId, ICustomException e, WsSession wsSession) {
        log.error("WebSocket error occurred: {} for session: {}", e.getResultCode(), wsSession.getSessionId(), e);

        WsGResponse<?> wsGResponse = WsGResponse.builder()
                .type(wsMessageRequestWithId.type() + ".res")
                .resultCode(e.getResultCode())
                .build();

        this.wsMessageSender.sendWsGResponse(wsGResponse, wsSession.getSessionId())
                .doOnError(error -> log.error("Failed to send error response to session: {}", wsSession.getSessionId(), error))
                .subscribe();
    }
}
