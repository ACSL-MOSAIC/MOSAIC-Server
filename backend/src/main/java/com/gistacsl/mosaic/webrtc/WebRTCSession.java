package com.gistacsl.mosaic.webrtc;

import java.util.UUID;

import lombok.Getter;

import com.gistacsl.mosaic.websocket.session.RobotWsSession;
import com.gistacsl.mosaic.websocket.session.UserWsSession;

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
