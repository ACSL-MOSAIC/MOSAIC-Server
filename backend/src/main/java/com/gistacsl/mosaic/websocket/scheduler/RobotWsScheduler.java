package com.gistacsl.mosaic.websocket.scheduler;

import com.gistacsl.mosaic.robot.RobotService;
import com.gistacsl.mosaic.robot.enumerate.RobotStatus;
import com.gistacsl.mosaic.websocket.handler.robot.MosaicRobotPingPongHandler;
import com.gistacsl.mosaic.websocket.session.WsSessionManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.OffsetDateTime;

@Slf4j
@Component
@RequiredArgsConstructor
public class RobotWsScheduler {
    private static final long UNAUTHENTICATED_TIMEOUT_SECONDS = 30;

    private final WsSessionManager wsSessionManager;
    private final MosaicRobotPingPongHandler robotPingPongHandler;
    private final RobotService robotService;

    @Scheduled(fixedDelay = 5000)
    public void scheduledPingPong() {
        log.debug("Running robot scheduled ping-pong check");

        // Check all robots from DB
        this.robotService.getAllRobots()
                .subscribe(robot -> {
                    // Check if robot has active session
                    this.wsSessionManager.getAuthenticatedRobotSessionByRobotPk(robot.getPk())
                            .ifPresentOrElse(
                                    // Session exists - send ping
                                    this.robotPingPongHandler::sendPing,
                                    // No session - update robot status to DISCONNECTED
                                    () -> {
                                        if (robot.getStatus() != RobotStatus.DISCONNECTED) {
                                            log.debug("Robot {} has no active session, updating status to DISCONNECTED", robot.getPk());
                                            this.robotService.updateRobotStatus(
                                                    RobotStatus.DISCONNECTED,
                                                    robot.getPk(),
                                                    robot.getOrganizationFk()
                                            ).subscribe();
                                        }
                                    }
                            );
                });

        // Check for timeout sessions
        this.robotPingPongHandler.checkAndCloseTimeoutSessions();

        log.debug("Scheduled robot ping-pong check completed");
    }

    @Scheduled(fixedDelay = 10000)
    public void checkUnauthenticatedSessions() {
        log.debug("Running unauthenticated session cleanup check");

        OffsetDateTime threshold = OffsetDateTime.now().minusSeconds(UNAUTHENTICATED_TIMEOUT_SECONDS);

        this.wsSessionManager.getAllRobotSessions()
                .filter(session -> !session.getIsAuthenticated())
                .filter(session -> session.getConnectedAt().isBefore(threshold))
                .forEach(session -> {
                    log.warn("Closing unauthenticated robot session: {} (connected at: {})",
                            session.getSessionId(), session.getConnectedAt());
                    session.close()
                            .doOnSuccess(v -> log.info("Unauthenticated robot session closed: {}", session.getSessionId()))
                            .doOnError(e -> log.error("Failed to close unauthenticated robot session: {}", session.getSessionId(), e))
                            .subscribe();
                });

        log.debug("Unauthenticated robot session cleanup check completed");
    }
}