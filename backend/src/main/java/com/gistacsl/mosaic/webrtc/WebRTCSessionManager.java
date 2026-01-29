package com.gistacsl.mosaic.webrtc;

import com.gistacsl.mosaic.common.enumerate.ResultCode;
import com.gistacsl.mosaic.common.exception.CustomException;
import com.gistacsl.mosaic.websocket.session.RobotWsSession;
import com.gistacsl.mosaic.websocket.session.UserWsSession;
import com.gistacsl.mosaic.websocket.session.WsSessionManager;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
public class WebRTCSessionManager {
    private final DSLContext dslContext;
    private final WsSessionManager wsSessionManager;
    private final Map<UUID, WebRTCSession> sessions = new ConcurrentHashMap<>();

    public WebRTCSession createNewSession(UUID userSessionId, UUID robotPk) throws CustomException {
        // Ownership between robot and user must be checked before creating a session
        RobotWsSession robotWsSession = wsSessionManager.getRobotSessionByRobotPk(robotPk)
                .orElseThrow(() -> new CustomException(ResultCode.ROBOT_WS_SESSION_NOT_EXIST));
        UserWsSession userWsSession = wsSessionManager.getUserSession(userSessionId)
                .orElseThrow(() -> new CustomException(ResultCode.USER_WS_SESSION_NOT_EXIST));

        WebRTCSession session = new WebRTCSession(robotWsSession, userWsSession);
        sessions.put(session.getSessionId(), session);
        return session;
    }

    public void removeSession(UUID sessionId) {
        sessions.remove(sessionId);
    }

    public WebRTCSession getSession(UUID sessionId) {
        return sessions.get(sessionId);
    }
}
