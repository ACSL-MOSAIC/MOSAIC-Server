package com.gistacsl.mosaic.websocket.scheduler;

import com.gistacsl.mosaic.websocket.handler.user.MosaicUserPingPongHandler;
import com.gistacsl.mosaic.websocket.session.WsSessionManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.OffsetDateTime;

@Slf4j
@Component
@RequiredArgsConstructor
public class UserWsScheduler {
    private static final long UNAUTHENTICATED_TIMEOUT_SECONDS = 30;

    private final WsSessionManager wsSessionManager;
    private final MosaicUserPingPongHandler userPingPongHandler;

    @Scheduled(fixedDelay = 5000)
    public void scheduledPingPong() {
        log.debug("Running scheduled user ping-pong check");

        this.wsSessionManager.getAllUserSessions().forEach(this.userPingPongHandler::sendPing);
        this.userPingPongHandler.checkAndCloseTimeoutSessions();

        log.debug("Scheduled user ping-pong check completed");
    }

    @Scheduled(fixedDelay = 10000)
    public void checkUnauthenticatedSessions() {
        log.debug("Running unauthenticated user session cleanup check");

        OffsetDateTime threshold = OffsetDateTime.now().minusSeconds(UNAUTHENTICATED_TIMEOUT_SECONDS);

        this.wsSessionManager.getAllUserSessions()
                .filter(session -> !session.getIsAuthenticated())
                .filter(session -> session.getConnectedAt().isBefore(threshold))
                .forEach(session -> {
                    log.warn("Closing unauthenticated user session: {} (connected at: {})",
                            session.getSessionId(), session.getConnectedAt());
                    session.close()
                            .doOnSuccess(v -> log.info("Unauthenticated user session closed: {}", session.getSessionId()))
                            .doOnError(e -> log.error("Failed to close unauthenticated user session: {}", session.getSessionId(), e))
                            .subscribe();
                });

        log.debug("Unauthenticated user session cleanup check completed");
    }
}