package com.gistacsl.mosaic.websocket.handler.user;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.gistacsl.mosaic.common.enumerate.ResultCode;
import com.gistacsl.mosaic.common.exception.CustomException;
import com.gistacsl.mosaic.websocket.dto.WsMessage;
import com.gistacsl.mosaic.websocket.handler.user.dto.UserSubscribeRobotStatusWsDto;
import com.gistacsl.mosaic.websocket.session.UserWsSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

@Slf4j
@Component
@RequiredArgsConstructor
public class MosaicUserStatusHandler {
    public static final String TYPE_PREFIX = "status";
    public static final String TYPE_SUBSCRIBE = TYPE_PREFIX + ".subscribe";
    public static final String TYPE_UNSUBSCRIBE = TYPE_PREFIX + ".unsubscribe";

    private final ObjectMapper objectMapper;

    public Mono<Void> handleWsMessage(WsMessage<?> wsMessage, UserWsSession wsSession) {
        return switch (wsMessage.getType()) {
            case TYPE_SUBSCRIBE -> this.handleSubscribe(wsMessage, wsSession);
            case TYPE_UNSUBSCRIBE -> this.handleUnsubscribe(wsMessage, wsSession);
            default -> Mono.error(new CustomException(ResultCode.UNKNOWN_WEBSOCKET_REQUEST_TYPE));
        };
    }

    private Mono<Void> handleSubscribe(WsMessage<?> wsMessage, UserWsSession wsSession) {
        UserSubscribeRobotStatusWsDto req = this.objectMapper.convertValue(wsMessage.getData(), UserSubscribeRobotStatusWsDto.class);
        wsSession.subscribeToRobots(req.robotIds());
        log.debug("User session {} subscribed to robots: {}", wsSession.getSessionId(), req.robotIds());
        return Mono.empty();
    }

    private Mono<Void> handleUnsubscribe(WsMessage<?> wsMessage, UserWsSession wsSession) {
        UserSubscribeRobotStatusWsDto req = this.objectMapper.convertValue(wsMessage.getData(), UserSubscribeRobotStatusWsDto.class);
        wsSession.unsubscribeFromRobots(req.robotIds());
        log.debug("User session {} unsubscribed from robots: {}", wsSession.getSessionId(), req.robotIds());
        return Mono.empty();
    }
}