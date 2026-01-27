package com.gistacsl.mosaic.common.exception;

import com.gistacsl.mosaic.common.enumerate.ResultCode;

public class CustomException extends Exception implements ICustomException {
    private final ResultCode resultCode;

    public CustomException(ResultCode resultCode) {
        super(resultCode.name());
        this.resultCode = resultCode;
    }

    public CustomException(ResultCode resultCode, Throwable e) {
        super(e);
        this.resultCode = resultCode;
    }

    @Override
    public ResultCode getResultCode() {
        return this.resultCode;
    }
}
