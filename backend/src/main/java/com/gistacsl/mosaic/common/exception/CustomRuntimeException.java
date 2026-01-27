package com.gistacsl.mosaic.common.exception;

import com.gistacsl.mosaic.common.enumerate.ResultCode;
import lombok.Getter;

@Getter
public class CustomRuntimeException extends RuntimeException implements ICustomException {
    private final ResultCode resultCode;

    public CustomRuntimeException(ResultCode resultCode) {
        super();
        this.resultCode = resultCode;
    }

    public CustomRuntimeException(ResultCode resultCode, Throwable e) {
        super(e);
        this.resultCode = resultCode;
    }
}
