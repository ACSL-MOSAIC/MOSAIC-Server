package com.gistacsl.mosaic.common;

import com.gistacsl.mosaic.common.enumerate.ResultCode;
import lombok.*;
import reactor.core.publisher.Mono;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class GResponse<T> {
    private ResultCode resultCode;
    private T resultData;

    public static <R> Mono<GResponse<R>> toGResponse(Mono<R> mono) {
        return GResponse.toGResponse(mono, ResultCode.SUCCESS);
    }

    public static <R> Mono<GResponse<R>> toGResponse(Mono<R> mono, ResultCode resultCode) {
        return mono.map(result -> GResponse.toGResponse(result, resultCode));
    }

    public static <R> GResponse<R> toGResponse(R res) {
        return GResponse.toGResponse(res, ResultCode.SUCCESS);
    }

    public static <R> GResponse<R> toGResponse(R res, ResultCode resultCode) {
        return GResponse.<R>builder()
                .resultCode(resultCode)
                .resultData(res)
                .build();
    }

    public static GResponse<?> toGResponse(ResultCode resultCode) {
        return GResponse.builder()
                .resultData(null)
                .resultCode(resultCode)
                .build();
    }
}
