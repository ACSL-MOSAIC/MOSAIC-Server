package com.gistacsl.mosaic.webrtc;

import com.gistacsl.mosaic.websocket.session.RobotWsSession;
import com.gistacsl.mosaic.websocket.session.UserWsSession;
import lombok.Getter;

import java.util.UUID;


@Getter
public class WebRTCSession {
    private final UUID sessionId;
    private final RobotWsSession robotWsSession;
    private final UserWsSession userWsSession;

    public WebRTCSession(RobotWsSession robotWsSession, UserWsSession userWsSession) {
        this.sessionId = UUID.randomUUID();
        this.robotWsSession = robotWsSession;
        this.userWsSession = userWsSession;
    }
}
