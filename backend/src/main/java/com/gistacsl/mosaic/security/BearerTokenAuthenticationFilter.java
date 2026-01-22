package com.gistacsl.mosaic.security;

import com.gistacsl.mosaic.common.enumerate.ResultCode;
import com.gistacsl.mosaic.common.exception.CustomException;
import com.gistacsl.mosaic.security.authentication.UserAuth;
import com.gistacsl.mosaic.security.jwt.JwtTokenService;
import org.springframework.http.HttpHeaders;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;

public class BearerTokenAuthenticationFilter implements WebFilter {
    private static final String BEARER_PREFIX = "Bearer ";
    private final JwtTokenService jwtTokenService;

    public BearerTokenAuthenticationFilter(JwtTokenService jwtTokenService) {
        this.jwtTokenService = jwtTokenService;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        String authorizationHeader = exchange.getRequest().getHeaders().getFirst(HttpHeaders.AUTHORIZATION);

        if (null == authorizationHeader || !authorizationHeader.startsWith(BEARER_PREFIX)) {
            return chain.filter(exchange);
        }

        return Mono.just(authorizationHeader.substring(BEARER_PREFIX.length()))
                .<UserAuth>handle((token, sink) -> {
                    try {
                        UserAuth userAuth = this.jwtTokenService.getUserAuthFromToken(token);
                        sink.next(userAuth);
                    } catch (CustomException e) {
                        sink.error(e);
                    } catch (Exception e) {
                        sink.error(new CustomException(ResultCode.JWT_TOKEN_UNEXPECTED_ERROR, e));
                    }
                })
                .flatMap(userAuth -> chain.filter(exchange).contextWrite(ReactiveSecurityContextHolder.withAuthentication(userAuth)));
    }
}
