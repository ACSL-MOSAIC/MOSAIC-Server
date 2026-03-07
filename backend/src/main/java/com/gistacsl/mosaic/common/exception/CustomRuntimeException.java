package com.gistacsl.mosaic.common.exception;

import lombok.Getter;

import com.gistacsl.mosaic.common.enumerate.ResultCode;

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
