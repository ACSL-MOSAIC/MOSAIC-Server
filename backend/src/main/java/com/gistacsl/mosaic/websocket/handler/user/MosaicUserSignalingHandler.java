package com.gistacsl.mosaic.websocket.handler.user;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.gistacsl.mosaic.common.enumerate.ResultCode;
import com.gistacsl.mosaic.common.exception.CustomException;
import com.gistacsl.mosaic.webrtc.WebRTCSession;
import com.gistacsl.mosaic.webrtc.WebRTCSessionManager;
import com.gistacsl.mosaic.websocket.handler.WsMessageSender;
import com.gistacsl.mosaic.websocket.handler.dto.ExchangeIceCandidateWsDto;
import com.gistacsl.mosaic.websocket.handler.dto.SendSdpOfferWsDto;
import com.gistacsl.mosaic.websocket.dto.WsMessage;
import com.gistacsl.mosaic.websocket.session.UserWsSession;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

@Component
@RequiredArgsConstructor
public class MosaicUserSignalingHandler {
    public static final String TYPE_PREFIX = "signaling";
    public static final String TYPE_SEND_SDP_OFFER = TYPE_PREFIX + ".send_sdp_offer";
    public static final String TYPE_EXCHANGE_ICE_CANDIDATE = TYPE_PREFIX + ".exchange_ice_candidate";

    private final ObjectMapper objectMapper;
    private final WsMessageSender wsMessageSender;
    private final WebRTCSessionManager webRTCSessionManager;

    public Mono<Void> handleWsMessage(WsMessage<?> wsMessage, UserWsSession wsSession) {
        try {
            if (wsMessage.getType().equals(TYPE_SEND_SDP_OFFER)) {
                SendSdpOfferWsDto req = this.objectMapper.convertValue(wsMessage.getData(), SendSdpOfferWsDto.class);
                this.handleSendSdpOffer(req, wsSession);
            } else if (wsMessage.getType().equals(TYPE_EXCHANGE_ICE_CANDIDATE)) {
                ExchangeIceCandidateWsDto req = this.objectMapper.convertValue(wsMessage.getData(), ExchangeIceCandidateWsDto.class);
                this.handleExchangeIceCandidate(req, wsSession);
            } else {
                return Mono.error(new CustomException(ResultCode.UNKNOWN_WEBSOCKET_REQUEST_TYPE));
            }
        } catch (CustomException e) {
            return Mono.error(e);
        } catch (Exception e) {
            return Mono.error(new CustomException(ResultCode.UNKNOWN_EXCEPTION_OCCURRED, e));
        }
        return Mono.empty();
    }

    private void handleSendSdpOffer(SendSdpOfferWsDto req, UserWsSession wsSession) throws CustomException {
        WebRTCSession webRTCSession = this.webRTCSessionManager.getSession(req.rtcConnectionId());
        if (webRTCSession == null) {
            throw new CustomException(ResultCode.WEBRTC_SESSION_NOT_EXIST);
        }
        if (!webRTCSession.getUserWsSession().equals(wsSession)) {
            throw new CustomException(ResultCode.ACCESS_DENIED);
        }

        WsMessage<SendSdpOfferWsDto> wsMessage = new WsMessage<>(TYPE_SEND_SDP_OFFER, req);
        this.wsMessageSender.sendWsMessageToRobot(wsMessage, webRTCSession.getRobotWsSession());
    }

    private void handleExchangeIceCandidate(ExchangeIceCandidateWsDto req, UserWsSession wsSession) throws CustomException {
        WebRTCSession webRTCSession = this.webRTCSessionManager.getSession(req.rtcConnectionId());
        if (webRTCSession == null) {
            throw new CustomException(ResultCode.WEBRTC_SESSION_NOT_EXIST);
        }
        if (webRTCSession.getUserWsSession().equals(wsSession)) {
            throw new CustomException(ResultCode.ACCESS_DENIED);
        }

        WsMessage<ExchangeIceCandidateWsDto> wsMessage = new WsMessage<>(TYPE_EXCHANGE_ICE_CANDIDATE, req);
        this.wsMessageSender.sendWsMessageToRobot(wsMessage, webRTCSession.getRobotWsSession());
    }
}
