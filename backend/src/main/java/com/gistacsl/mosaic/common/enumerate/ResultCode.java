package com.gistacsl.mosaic.common.enumerate;

import lombok.Getter;
import org.springframework.http.HttpStatus;

public enum ResultCode implements SerializableEnum {
    SUCCESS(100, "OK", HttpStatus.OK),

    UNKNOWN_EXCEPTION_OCCURRED(10000, "UNKNOWN_EXCEPTION_OCCURRED", HttpStatus.INTERNAL_SERVER_ERROR),
    INVALID_FORMAT(10001, "INVALID_FORMAT", HttpStatus.BAD_REQUEST),
    UNKNOWN_WEBSOCKET_REQUEST_TYPE(10002, "UNKNOWN_WEBSOCKET_REQUEST_TYPE", HttpStatus.BAD_REQUEST),

    JWT_TOKEN_EXPIRED(10010, "JWT_TOKEN_EXPIRED", HttpStatus.UNAUTHORIZED),
    JWT_TOKEN_SIGNATURE_FAILED(10011, "JWT_TOKEN_SIGNATURE_FAILED", HttpStatus.UNAUTHORIZED),
    JWT_TOKEN_DECRYPTING_FAILED(10012, "JWT_TOKEN_DECRYPTING_FAILED", HttpStatus.UNAUTHORIZED),
    JWT_TOKEN_UNEXPECTED_ERROR(10013, "JWT_TOKEN_UNEXPECTED_ERROR", HttpStatus.UNAUTHORIZED),
    JWT_TOKEN_VERIFY_FAILED(10014, "JWT_TOKEN_VERIFY_FAILED", HttpStatus.UNAUTHORIZED),
    INVALID_PUBLIC_KEY(10015, "INVALID_PUBLIC_KEY", HttpStatus.UNAUTHORIZED),

    ACCESS_DENIED(10020, "ACCESS_DENIED", HttpStatus.FORBIDDEN),
    AUTHENTICATION_FAILED(10021, "AUTHENTICATION_FAILED", HttpStatus.UNAUTHORIZED),
    CANNOT_FIND_USER_AUTH_FROM_CONTEXT(10022, "CANNOT_FIND_USER_AUTH_FROM_CONTEXT", HttpStatus.UNAUTHORIZED),

    WEBSOCKET_SESSION_NOT_EXIST(10050, "WEBSOCKET_SESSION_NOT_EXIST", HttpStatus.BAD_REQUEST),
    ;

    private final int value;

    @Getter
    private final String description;

    @Getter
    private final HttpStatus httpStatus;

    ResultCode(int value, String description, HttpStatus httpStatus) {
        this.value = value;
        this.description = description;
        this.httpStatus = httpStatus;
    }

    @Override
    public int getValue() {
        return this.value;
    }

}