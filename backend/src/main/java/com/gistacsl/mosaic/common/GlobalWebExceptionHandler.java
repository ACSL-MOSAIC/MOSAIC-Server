package com.gistacsl.mosaic.common;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.gistacsl.mosaic.common.enumerate.ResultCode;
import com.gistacsl.mosaic.common.exception.CustomException;
import com.gistacsl.mosaic.common.exception.ICustomException;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.web.reactive.error.ErrorWebExceptionHandler;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.ServerWebInputException;
import reactor.core.publisher.Mono;

@Slf4j
@Order(-2) // Must be higher than DefaultErrorWebExceptionHandler
@Configuration
@RequiredArgsConstructor
public class GlobalWebExceptionHandler implements ErrorWebExceptionHandler {
    //    private final CustomHttpLogger logger;
    public static final String DEFAULT_ERROR_BODY = "{\"resultCode\": " + ResultCode.UNKNOWN_EXCEPTION_OCCURRED.getValue() + "}";
    private ObjectMapper objectMapper;

    @PostConstruct
    public void init() {
        this.objectMapper = new ObjectMapper();
    }

    @Override
    public Mono<Void> handle(ServerWebExchange exchange, Throwable ex) {
        ServerHttpResponse response = exchange.getResponse();
        response.getHeaders().setContentType(MediaType.APPLICATION_JSON);
        response.setStatusCode(getStatusCode(ex));

        String responseBody = getResponseBody(ex);
        log.error("Error occurred: {}", responseBody, ex);
//        logger.logResponse(exchange, responseBody);

        Mono<DataBuffer> dataBuffer = Mono.just(response.bufferFactory().wrap(responseBody.getBytes()));
        return response.writeWith(dataBuffer);
    }

    private HttpStatusCode getStatusCode(Throwable ex) {
        if (ex instanceof ICustomException customException) {
            return customException.getResultCode().getHttpStatus();
        } else if (ex instanceof ServerWebInputException) {
            return HttpStatus.BAD_REQUEST;
        } else {
            return HttpStatus.INTERNAL_SERVER_ERROR;
        }
    }

    private String getResponseBody(Throwable ex) {
        if (ex instanceof ICustomException customException) {
            return this.getResponseBodyByCustomException(customException);
        } else if (ex instanceof ServerWebInputException serverWebInputException) {
            return this.getResponseBodyByCustomException(new CustomException(ResultCode.INVALID_FORMAT, serverWebInputException));
        } else {
            return DEFAULT_ERROR_BODY;
        }
    }

    private String getResponseBodyByCustomException(ICustomException ex) {
        try {
            return this.objectMapper.writeValueAsString(GResponse.toGResponse(ex.getResultCode()));
        } catch (Exception e) {
            return DEFAULT_ERROR_BODY;
        }
    }
}
