package com.gistacsl.mosaic.websocket.session;

import jakarta.annotation.PreDestroy;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.socket.WebSocketSession;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Stream;

@Component
public class WsSessionManager {

    private final Map<UUID, RobotWsSession> robotSessionMap = new ConcurrentHashMap<>();
    private final Map<UUID, UserWsSession> userSessionMap = new ConcurrentHashMap<>();

    @PreDestroy
    public void closeAllSessions() {
        this.robotSessionMap.values().forEach(WebSocketSession::close);
    }

    public void addRobotSession(UUID sessionId, RobotWsSession session) {
        this.robotSessionMap.put(sessionId, session);
    }

    public void removeRobotSession(UUID sessionId) {
        this.robotSessionMap.remove(sessionId);
    }

    public Optional<RobotWsSession> getRobotSession(UUID sessionId) {
        return Optional.ofNullable(this.robotSessionMap.get(sessionId));
    }

    public Optional<RobotWsSession> getRobotSessionByRobotPk(UUID robotPk) {
        return this.robotSessionMap.values().stream()
                .filter(RobotWsSession::getIsAuthenticated)
                .filter(session -> session.getRobotPk().equals(robotPk))
                .findFirst();
    }

    public void addUserSession(UUID sessionId, UserWsSession session) {
        this.userSessionMap.put(sessionId, session);
    }

    public void removeUserSession(UUID sessionId) {
        this.userSessionMap.remove(sessionId);
    }

    public Optional<UserWsSession> getUserSession(UUID sessionId) {
        return Optional.ofNullable(this.userSessionMap.get(sessionId));
    }

    public Stream<UserWsSession> getUserSessionByOrganizationPk(UUID organizationPk) {
        return this.userSessionMap.values().stream()
                .filter(UserWsSession::getIsAuthenticated)
                .filter(session -> session.getUserAuth().getOrganizationPk().equals(organizationPk));
    }
}
