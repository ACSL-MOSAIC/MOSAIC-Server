package com.gistacsl.mosaic.websocket.handler;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.gistacsl.mosaic.common.GResponse;
import com.gistacsl.mosaic.common.enumerate.ResultCode;
import com.gistacsl.mosaic.common.exception.CustomException;
import com.gistacsl.mosaic.websocket.dto.WsMessage;
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

    public <R> void sendWsMessageToRobot(WsMessage<R> wsMessage, UUID targetSessionId) throws CustomException {
        Optional<RobotWsSession> optionalWsSession = this.wsSessionManager.getRobotSession(targetSessionId);
        if (optionalWsSession.isEmpty()) {
            log.warn("WebSocket session not found: {}", targetSessionId);
            throw new CustomException(ResultCode.WEBSOCKET_SESSION_NOT_EXIST);
        }

        RobotWsSession wsSession = optionalWsSession.get();
        this.sendWsMessageToRobot(wsMessage, wsSession);
    }

    public <R> void sendWsMessageToRobot(WsMessage<R> wsMessage, RobotWsSession wsSession) throws CustomException {
        wsSession.sendMessage(this.wsMessageToString(wsMessage));
        log.debug("WebSocket message sent successfully to session: {}", wsSession.getSessionId());
    }

    public <R> void sendWsMessageToUser(WsMessage<R> wsMessage, UUID targetSessionId) throws CustomException {
        log.debug("Sending WebSocket response to User session: {}", targetSessionId);
        Optional<UserWsSession> optionalWsSession = this.wsSessionManager.getUserSession(targetSessionId);
        if (optionalWsSession.isEmpty()) {
            log.warn("WebSocket session not found: {}", targetSessionId);
            throw new CustomException(ResultCode.WEBSOCKET_SESSION_NOT_EXIST);
        }

        UserWsSession wsSession = optionalWsSession.get();
        this.sendWsMessageToUser(wsMessage, wsSession);
    }

    public <R> void sendWsMessageToUser(WsMessage<R> wsMessage, UserWsSession wsSession) throws CustomException {
        wsSession.sendMessage(this.wsMessageToString(wsMessage));
        log.debug("WebSocket message sent successfully to session: {}", wsSession.getSessionId());
    }

    private String wsMessageToString(WsMessage<?> wsMessage) throws CustomException {
        try {
            return this.objectMapper.writeValueAsString(wsMessage);
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize WsMessage to JSON: {}", wsMessage, e);
            throw new CustomException(ResultCode.UNKNOWN_EXCEPTION_OCCURRED, e);
        }
    }
}
