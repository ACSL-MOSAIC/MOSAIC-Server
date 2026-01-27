package com.gistacsl.mosaic.websocket;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.gistacsl.mosaic.common.GResponse;
import com.gistacsl.mosaic.common.enumerate.ResultCode;
import com.gistacsl.mosaic.common.exception.CustomException;
import com.gistacsl.mosaic.websocket.dto.WsGResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class WsMessageSender {
    private final ObjectMapper objectMapper;
    private final WsSessionManager wsSessionManager;

    public <R> Mono<Void> convertAndSendWsGResponse(GResponse<R> gResponse, String requestType, UUID targetSessionId) {
        return Mono.just(this.gResponseToWsGResponse(requestType, gResponse))
                .flatMap(wsGResponse -> sendWsGResponse(wsGResponse, targetSessionId));
    }

    public <R> Mono<Void> sendWsGResponse(WsGResponse<R> wsGResponse, UUID targetSessionId) {
        return this.wsGResponseToWsMessage(wsGResponse)
                .flatMap((wsMessage) -> {
                    Optional<WsSession> optionalWsSession = this.wsSessionManager.getSession(targetSessionId);
                    if (optionalWsSession.isEmpty()) {
                        return Mono.error(new CustomException(ResultCode.WEBSOCKET_SESSION_NOT_EXIST));
                    } else {
                        WsSession wsSession = optionalWsSession.get();
                        wsSession.getSinks().tryEmitNext(wsMessage);
                    }
                    return Mono.empty();
                });
    }

    private <R> WsGResponse<R> gResponseToWsGResponse(String type, GResponse<R> gResponse) {
        return WsGResponse.<R>builder()
                .type(type + ".res")
                .resultCode(gResponse.getResultCode())
                .resultData(gResponse.getResultData())
                .build();
    }

    private Mono<String> wsGResponseToWsMessage(WsGResponse<?> wsGResponse) {
        try {
            return Mono.just(this.objectMapper.writeValueAsString(wsGResponse));
        } catch (JsonProcessingException e) {
            return Mono.error(new CustomException(ResultCode.UNKNOWN_EXCEPTION_OCCURRED, e));
        }
    }

}
