package com.gistacsl.mosaic.security;

import com.gistacsl.mosaic.common.enumerate.ResultCode;
import com.gistacsl.mosaic.common.exception.CustomException;
import com.gistacsl.mosaic.security.authentication.UserAuth;
import org.springframework.http.HttpHeaders;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;

public class BearerTokenAuthenticationFilter implements WebFilter {
    private static final String BEARER_PREFIX = "Bearer ";
//    private final JwtExtractService jwtExtractService;

//    public BearerTokenAuthenticationFilter(JwtExtractService jwtExtractService) {
//        this.jwtExtractService = jwtExtractService;
//    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        String authorizationHeader = exchange.getRequest().getHeaders().getFirst(HttpHeaders.AUTHORIZATION);

        if (null == authorizationHeader || false == authorizationHeader.startsWith(BEARER_PREFIX)) {
            return chain.filter(exchange);
        }

        return Mono.just(authorizationHeader.substring(BEARER_PREFIX.length()))
                .<UserAuth>handle((token, sink) -> {
                    try {
                        // TODO
                        sink.next(UserAuth.fromAutoJsonWebToken());
//                    } catch (V2GExpiredJwtException e) {
//                        sink.error(new CustomException(ResultCode.JWT_TOKEN_EXPIRED, e));
//                    } catch (V2GSignatureException e) {
//                        sink.error(new CustomException(ResultCode.JWT_TOKEN_SIGNATURE_FAILED, e));
//                    } catch (V2GInvalidTokenException e) {
//                        sink.error(new CustomException(ResultCode.JWT_TOKEN_DECRYPTING_FAILED, e));
//                    } catch (V2GVerifyFailedException e) {
//                        sink.error(new CustomException(ResultCode.JWT_TOKEN_VERIFY_FAILED, e));
                    } catch (Exception e) {
                        sink.error(new CustomException(ResultCode.JWT_TOKEN_UNEXPECTED_ERROR, e));
                    }
                })
                .flatMap(userAuth -> chain.filter(exchange).contextWrite(ReactiveSecurityContextHolder.withAuthentication(userAuth)));
    }
}
