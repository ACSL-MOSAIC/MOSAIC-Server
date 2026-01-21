package com.gistacsl.mosaic.common.exception;

import com.gistacsl.mosaic.common.enumerate.ResultCode;
import lombok.Getter;

@Getter
public class CustomRuntimeException extends RuntimeException implements ICustomException {
    private Integer resultCode;

    public CustomRuntimeException() {
        super();
    }

    public CustomRuntimeException(ResultCode resultCode) {
        super();
        this.resultCode = resultCode.getValue();
    }

    public CustomRuntimeException(ResultCode resultCode, Throwable e) {
        super(e);
        this.resultCode = resultCode.getValue();
    }

    public CustomRuntimeException(String message) {
        super(message);
    }

    public CustomRuntimeException(String message, Throwable e) {
        super(message, e);
    }
}
