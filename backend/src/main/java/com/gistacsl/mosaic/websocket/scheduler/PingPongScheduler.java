package com.gistacsl.mosaic.websocket.scheduler;

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

    @Scheduled(fixedDelay = 5000)
    public void scheduledPingPong() {
        log.debug("Running scheduled ping-pong check");

        // Send ping to all robot sessions
        this.wsSessionManager.getAllRobotSessions().forEach(this.robotPingPongHandler::sendPing);

        // Send ping to all user sessions
        this.wsSessionManager.getAllUserSessions().forEach(this.userPingPongHandler::sendPing);

        // Check for timeout sessions
        this.robotPingPongHandler.checkAndCloseTimeoutSessions();
        this.userPingPongHandler.checkAndCloseTimeoutSessions();

        log.debug("Scheduled ping-pong check completed");
    }
}