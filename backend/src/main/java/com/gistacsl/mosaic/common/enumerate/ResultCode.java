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
    ACCESS_TOKEN_GENERATION_FAILED(2011, "Access Token Generation Failed", HttpStatus.CONFLICT),
    REFRESH_TOKEN_GENERATION_FAILED(2012, "Refresh Token Generation Failed", HttpStatus.CONFLICT),
    REFRESH_TOKEN_NOT_MATCH(2013, "Refresh Token Not Match", HttpStatus.CONFLICT),
    TOKEN_TYPE_NOT_SUPPORTED(2014, "Token Type Not Supported", HttpStatus.BAD_REQUEST),
    ACCESS_TOKEN_NOT_EXIST(2015, "Access Token Not Exist", HttpStatus.FORBIDDEN),
    ACCESS_TOKEN_DECRYPTING_FAILED(2002, "Decrypting Access Token Failed", HttpStatus.FORBIDDEN),
    REFRESH_TOKEN_DECRYPTING_FAILED(2003, "Decrypting Refresh Token Failed", HttpStatus.FORBIDDEN),
    JWT_TOKEN_NOT_SUPPORTED(2009, "JWT Token Not Supported", HttpStatus.FORBIDDEN),
    ACCESS_TOKEN_EXPIRED(2004, "Access Token expired", HttpStatus.FORBIDDEN),
    REFRESH_TOKEN_EXPIRED(2005, "Refresh Token expired", HttpStatus.FORBIDDEN),
    REFRESH_TOKEN_NOT_EXIST(2006, "Refresh Token Not Exist", HttpStatus.FORBIDDEN),

    ACCESS_DENIED(10020, "ACCESS_DENIED", HttpStatus.FORBIDDEN),
    AUTHENTICATION_FAILED(10021, "AUTHENTICATION_FAILED", HttpStatus.UNAUTHORIZED),
    CANNOT_FIND_USER_AUTH_FROM_CONTEXT(10022, "CANNOT_FIND_USER_AUTH_FROM_CONTEXT", HttpStatus.UNAUTHORIZED),

    WEBSOCKET_SESSION_NOT_EXIST(10050, "WEBSOCKET_SESSION_NOT_EXIST", HttpStatus.BAD_REQUEST),

    // Robot errors
    ROBOT_NOT_FOUND(20001, "ROBOT_NOT_FOUND", HttpStatus.NOT_FOUND),
    DB_ROBOT_CREATE_FAILED(20002, "DB_ROBOT_CREATE_FAILED", HttpStatus.INTERNAL_SERVER_ERROR),
    DB_ROBOT_READ_FAILED(20003, "DB_ROBOT_READ_FAILED", HttpStatus.INTERNAL_SERVER_ERROR),
    DB_ROBOT_UPDATE_FAILED(20004, "DB_ROBOT_UPDATE_FAILED", HttpStatus.INTERNAL_SERVER_ERROR),
    DB_ROBOT_DELETE_FAILED(20005, "DB_ROBOT_DELETE_FAILED", HttpStatus.INTERNAL_SERVER_ERROR),
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