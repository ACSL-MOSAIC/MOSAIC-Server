package com.gistacsl.mosaic.websocket.scheduler;

import com.gistacsl.mosaic.robot.RobotService;
import com.gistacsl.mosaic.robot.enumerate.RobotStatus;
import com.gistacsl.mosaic.websocket.handler.robot.MosaicRobotPingPongHandler;
import com.gistacsl.mosaic.websocket.handler.user.MosaicUserPingPongHandler;
import com.gistacsl.mosaic.websocket.session.WsSessionManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class PingPongScheduler {
    private final WsSessionManager wsSessionManager;
    private final MosaicRobotPingPongHandler robotPingPongHandler;
    private final MosaicUserPingPongHandler userPingPongHandler;
    private final RobotService robotService;

    @Scheduled(fixedDelay = 5000)
    public void scheduledPingPong() {
        log.debug("Running scheduled ping-pong check");

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

        // Send ping to all user sessions
        this.wsSessionManager.getAllUserSessions().forEach(this.userPingPongHandler::sendPing);

        // Check for timeout sessions
        this.robotPingPongHandler.checkAndCloseTimeoutSessions();
        this.userPingPongHandler.checkAndCloseTimeoutSessions();

        log.debug("Scheduled ping-pong check completed");
    }
}