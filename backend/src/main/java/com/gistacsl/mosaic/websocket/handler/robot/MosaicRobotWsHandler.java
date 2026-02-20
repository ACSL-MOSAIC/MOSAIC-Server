package com.gistacsl.mosaic.websocket.handler.robot;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.gistacsl.mosaic.common.enumerate.ResultCode;
import com.gistacsl.mosaic.common.exception.CustomException;
import com.gistacsl.mosaic.robot.RobotService;
import com.gistacsl.mosaic.robot.enumerate.RobotStatus;
import com.gistacsl.mosaic.websocket.handler.WsMessageSender;
import com.gistacsl.mosaic.websocket.session.RobotWsSession;
import com.gistacsl.mosaic.websocket.session.WsSessionManager;
import com.gistacsl.mosaic.websocket.dto.WsMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.socket.WebSocketHandler;
import org.springframework.web.reactive.socket.WebSocketSession;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.publisher.Sinks;
import reactor.core.scheduler.Schedulers;

@Slf4j
@Component
@RequiredArgsConstructor
public class MosaicRobotWsHandler implements WebSocketHandler {
    private final ObjectMapper objectMapper;
    private final MosaicRobotAuthorizeHandler mosaicRobotAuthorizeHandler;
    private final MosaicRobotSignalingHandler mosaicRobotSignalingHandler;
    private final MosaicRobotStatusHandler mosaicRobotStatusHandler;
    private final MosaicRobotPingPongHandler mosaicRobotPingPongHandler;

    private final WsMessageSender wsMessageSender;
    private final WsSessionManager wsSessionManager;
    private final RobotService robotService;

    public Mono<Void> handleWsMessageRequest(WsMessage<?> wsMessage, RobotWsSession wsSession) {
        String prefix = wsMessage.getType().split("\\.")[0];
        return switch (prefix) {
            case MosaicRobotPingPongHandler.TYPE_PREFIX ->
                    this.mosaicRobotPingPongHandler.handleWsMessage(wsMessage, wsSession);
            case MosaicRobotAuthorizeHandler.TYPE_PREFIX ->
                    this.mosaicRobotAuthorizeHandler.handleWsMessage(wsMessage, wsSession)
                            .then(Mono.defer(() -> this.processPendingMessages(wsSession)));
            case MosaicRobotSignalingHandler.TYPE_PREFIX ->
                    this.mosaicRobotSignalingHandler.handleWsMessage(wsMessage, wsSession);
            case MosaicRobotStatusHandler.TYPE_PREFIX ->
                    this.mosaicRobotStatusHandler.handleWsMessage(wsMessage, wsSession);
            default -> Mono.error(new CustomException(ResultCode.UNKNOWN_WEBSOCKET_REQUEST_TYPE));
        };
    }

    private Mono<Void> processPendingMessages(RobotWsSession wsSession) {
        if (!wsSession.getIsAuthenticated()) return Mono.empty();
        return Flux.fromIterable(wsSession.drainPendingMessages())
                .concatMap(msg -> this.handleWsMessageRequest(msg, wsSession)
                        .onErrorResume(throwable -> {
                            if (throwable instanceof CustomException e) {
                                if (ResultCode.WEBSOCKET_SESSION_NOT_EXIST != e.getResultCode()) {
                                    WsMessage<ResultCode> newWsMessage = new WsMessage<>(msg.getType(), e.getResultCode());
                                    this.handleError(newWsMessage, e, wsSession);
                                }
                            } else {
                                WsMessage<ResultCode> newWsMessage = new WsMessage<>(msg.getType() + ".res", ResultCode.UNKNOWN_EXCEPTION_OCCURRED);
                                this.handleError(newWsMessage, new CustomException(ResultCode.UNKNOWN_EXCEPTION_OCCURRED, throwable), wsSession);
                            }
                            return Mono.empty();
                        }))
                .then();
    }

    @Override
    public Mono<Void> handle(WebSocketSession session) {
        RobotWsSession wsSession = (RobotWsSession) session;
        Sinks.Many<String> sinks = wsSession.getSinks();

        Mono<Void> output = wsSession.send(sinks.asFlux()
                .map(session::textMessage));
        Mono<Void> input = wsSession.receive()
                .<WsMessage<?>>handle((webSocketMessage, synchronousSink) -> {
                    try {
                        String payload = webSocketMessage.getPayloadAsText();
                        log.debug("Received WebSocket message: {}", payload);
                        WsMessage<?> wsMessage = this.objectMapper.readValue(payload, WsMessage.class);
                        synchronousSink.next(wsMessage);
                    } catch (Exception e) {
                        WsMessage<ResultCode> wsMessage = new WsMessage<>("unknown.res", ResultCode.INVALID_FORMAT);
                        this.handleError(wsMessage, e, wsSession);
                        // Continue processing - don't break the stream
                    }
                })
                .<WsMessage<?>>handle((wsMessage, synchronousSink) -> {
                    if (!wsMessage.getType().equals(MosaicRobotAuthorizeHandler.TYPE_PREFIX) && false == wsSession.getIsAuthenticated()) {
                        log.debug("Queuing message type '{}' for unauthenticated session: {}", wsMessage.getType(), wsSession.getSessionId());
                        wsSession.enqueuePendingMessage(wsMessage);
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
                                WsMessage<ResultCode> newWsMessage = new WsMessage<>(wsMessage.getType() + ".res", ResultCode.UNKNOWN_EXCEPTION_OCCURRED);
                                this.handleError(newWsMessage, new CustomException(ResultCode.UNKNOWN_EXCEPTION_OCCURRED, throwable), wsSession);
                            }
                            return Mono.empty();
                        })
                        .subscribeOn(Schedulers.boundedElastic())
                        .subscribe())
                .onErrorContinue((e, o) ->
                        {
                            WsMessage<?> wsMessage = (WsMessage<?>) o;
                            WsMessage<ResultCode> newWsMessage = new WsMessage<>(wsMessage.getType() + ".res", ResultCode.UNKNOWN_EXCEPTION_OCCURRED);
                            this.handleError(newWsMessage, new CustomException(ResultCode.UNKNOWN_EXCEPTION_OCCURRED, e), wsSession);
                        }
                )
                .then();

        return Mono.zip(output, input)
                .publishOn(Schedulers.boundedElastic())
                .doOnTerminate(() -> {
                    this.wsSessionManager.removeRobotSession(wsSession.getSessionId());

                    // Update robot status to DISCONNECTED if authenticated
                    if (wsSession.getRobotPk() != null && wsSession.getOrganizationFk() != null) {
                        this.robotService.updateRobotStatus(
                                RobotStatus.DISCONNECTED,
                                wsSession.getRobotPk(),
                                wsSession.getOrganizationFk()
                        ).subscribe();
                    }
                })
                .then();
    }

    private void handleError(WsMessage<ResultCode> wsMessage, Exception e, RobotWsSession wsSession) {
        log.error("WebSocket error occurred: {} for session: {}", e.getMessage(), wsSession.getSessionId(), e);

        try {
            this.wsMessageSender.sendWsMessageToRobot(wsMessage, wsSession);
        } catch (CustomException e1) {
            log.error("Failed to send error response to session: {}", wsSession.getSessionId(), e1);
        }
    }
}
