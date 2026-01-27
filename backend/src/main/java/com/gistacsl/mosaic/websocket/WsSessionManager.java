package com.gistacsl.mosaic.websocket;

import jakarta.annotation.PreDestroy;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.socket.WebSocketSession;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class WsSessionManager {

    private final Map<UUID, WsSession> sessionMap = new ConcurrentHashMap<>();

    @PreDestroy
    public void closeAllSessions() {
        this.sessionMap.values().forEach(WebSocketSession::close);
    }

    public void addSession(UUID sessionId, WsSession session) {
        this.sessionMap.put(sessionId, session);
    }

    public void removeSession(UUID sessionId) {
        this.sessionMap.remove(sessionId);
    }

    public Optional<WsSession> getSession(UUID sessionId) {
        return Optional.ofNullable(this.sessionMap.get(sessionId));
    }
}
