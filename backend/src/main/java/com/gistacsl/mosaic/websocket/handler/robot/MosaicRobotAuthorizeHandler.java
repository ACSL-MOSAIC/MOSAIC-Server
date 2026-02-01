package com.gistacsl.mosaic.websocket.handler.robot;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.gistacsl.mosaic.common.enumerate.ResultCode;
import com.gistacsl.mosaic.common.exception.CustomException;
import com.gistacsl.mosaic.robot.RobotService;
import com.gistacsl.mosaic.robot.enumerate.RobotStatus;
import com.gistacsl.mosaic.websocket.handler.WsMessageSender;
import com.gistacsl.mosaic.websocket.handler.robot.auth.MosaicBaseAuthHandler;
import com.gistacsl.mosaic.websocket.handler.robot.auth.RobotAuthHandlerRegistry;
import com.gistacsl.mosaic.websocket.handler.robot.dto.RobotAuthorizeWsDto;
import com.gistacsl.mosaic.websocket.session.RobotWsSession;
import com.gistacsl.mosaic.websocket.dto.WsMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

@Slf4j
@Component
@RequiredArgsConstructor
public class MosaicRobotAuthorizeHandler {
    public static final String TYPE_PREFIX = "authorize";

    private final ObjectMapper objectMapper;
    private final WsMessageSender wsMessageSender;
    private final RobotService robotService;
    private final RobotAuthHandlerRegistry authHandlerRegistry;

    public Mono<Void> handleWsMessage(WsMessage<?> wsMessage, RobotWsSession wsSession) {
        RobotAuthorizeWsDto<?> req = this.objectMapper.convertValue(wsMessage.getData(), RobotAuthorizeWsDto.class);

        return this.robotService.getRobotEntity(req.getRobotId())
                .flatMap(robotEntity -> {
                    try {
                        MosaicBaseAuthHandler authHandler = this.authHandlerRegistry.getHandler(robotEntity.getAuthType());
                        return authHandler.handleMessage(req, robotEntity, wsSession)
                                .then(Mono.defer(() -> {
                                    if (wsSession.getIsAuthenticated()) {
                                        replyMessage(wsSession, ResultCode.SUCCESS);
                                        return this.robotService.updateRobotStatus(RobotStatus.WS_CONNECTED, robotEntity.getPk(), robotEntity.getOrganizationFk());
                                    } else {
                                        replyMessage(wsSession, ResultCode.AUTHENTICATION_FAILED);
                                        return Mono.empty();
                                    }
                                }));
                    } catch (CustomException e) {
                        replyMessage(wsSession, e.getResultCode());
                        return Mono.empty();
                    } catch (Exception e) {
                        log.error("Unknown exception occurred during authorization:", e);
                        replyMessage(wsSession, ResultCode.UNKNOWN_EXCEPTION_OCCURRED);
                        return Mono.empty();
                    }
                });
    }

    private void replyMessage(RobotWsSession wsSession, ResultCode resultCode) {
        WsMessage<ResultCode> response = new WsMessage<>(TYPE_PREFIX + ".res", resultCode);
        try {
            this.wsMessageSender.sendWsMessageToRobot(response, wsSession);
        } catch (CustomException e) {
            log.error("Failed to send error response to session: {}", wsSession.getSessionId(), e);
        }
    }
}
