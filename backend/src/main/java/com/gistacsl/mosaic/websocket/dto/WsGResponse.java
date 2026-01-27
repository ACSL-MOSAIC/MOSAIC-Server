package com.gistacsl.mosaic.websocket.dto;

import com.gistacsl.mosaic.common.enumerate.ResultCode;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WsGResponse<T> {
    private String type;
    @Builder.Default
    private ResultCode resultCode = ResultCode.SUCCESS;
    @Builder.Default
    private T resultData = null;
}
