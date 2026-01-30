package com.gistacsl.mosaic.websocket.handler.robot;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.gistacsl.mosaic.common.enumerate.ResultCode;
import com.gistacsl.mosaic.common.exception.CustomException;
import com.gistacsl.mosaic.robot.RobotService;
import com.gistacsl.mosaic.robot.enumerate.RobotStatus;
import com.gistacsl.mosaic.websocket.dto.WsMessage;
import com.gistacsl.mosaic.websocket.handler.WsMessageSender;
import com.gistacsl.mosaic.websocket.handler.robot.dto.RobotUpdateStatusWsDto;
import com.gistacsl.mosaic.websocket.handler.user.dto.UserUpdateRobotStatusWsDto;
import com.gistacsl.mosaic.websocket.session.RobotWsSession;
import com.gistacsl.mosaic.websocket.session.WsSessionManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

@Slf4j
@Component
@RequiredArgsConstructor
public class MosaicRobotStatusHandler {
    public static final String TYPE_PREFIX = "status";
    public static final String TYPE_UPDATE = TYPE_PREFIX + ".update";

    private final ObjectMapper objectMapper;
    private final WsMessageSender wsMessageSender;
    private final WsSessionManager wsSessionManager;
    private final RobotService robotService;

    public Mono<Void> handleWsMessage(WsMessage<?> wsMessage, RobotWsSession wsSession) {
        if (!wsMessage.getType().equals(TYPE_UPDATE)) {
            return Mono.error(new CustomException(ResultCode.UNKNOWN_WEBSOCKET_REQUEST_TYPE));
        }

        RobotUpdateStatusWsDto req = this.objectMapper.convertValue(wsMessage.getData(), RobotUpdateStatusWsDto.class);
        return this.updateRobotStatus(req.status(), wsSession)
                .then(this.notifyToOrganization(req.status(), wsSession));
    }

    private Mono<Void> updateRobotStatus(RobotStatus robotStatus, RobotWsSession wsSession) {
        return this.robotService.updateRobotStatus(robotStatus, wsSession.getRobotPk(), wsSession.getOrganizationFk());
    }

    private Mono<Void> notifyToOrganization(RobotStatus robotStatus, RobotWsSession wsSession) {
        WsMessage<UserUpdateRobotStatusWsDto> wsMessage = new WsMessage<>(TYPE_UPDATE, new UserUpdateRobotStatusWsDto(wsSession.getRobotPk(), robotStatus));
        this.wsSessionManager.getUserSessionByOrganizationPk(wsSession.getOrganizationFk())
                .forEach(userWsSession -> {
                    try {
                        this.wsMessageSender.sendWsMessageToUser(wsMessage, userWsSession);
                    } catch (CustomException e) {
                        log.error("Failed to send robot status update to user: {}", userWsSession.getSessionId(), e);
                    }
                });
        return Mono.empty();
    }
}
