package com.gistacsl.mosaic.websocket.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@AllArgsConstructor
public class WsMessage<T> {
    private String type;
    @Builder.Default
    private T data = null;
}
