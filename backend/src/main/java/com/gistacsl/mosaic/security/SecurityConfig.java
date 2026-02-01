package com.gistacsl.mosaic.security;

import com.gistacsl.mosaic.common.enumerate.ResultCode;
import com.gistacsl.mosaic.common.exception.CustomRuntimeException;
import com.gistacsl.mosaic.security.jwt.JwtTokenService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.SecurityWebFiltersOrder;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.server.SecurityWebFilterChain;
import org.springframework.security.web.server.util.matcher.PathPatternParserServerWebExchangeMatcher;
import org.springframework.web.cors.CorsConfiguration;
import reactor.core.publisher.Mono;

@Slf4j
@Configuration
@EnableWebFluxSecurity
@RequiredArgsConstructor
public class SecurityConfig {
    private final JwtTokenService jwtTokenService;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityWebFilterChain securityWebFilterChain(ServerHttpSecurity http) {
        return http
                .csrf(ServerHttpSecurity.CsrfSpec::disable)
                .cors(corsSpec -> corsSpec.configurationSource(exchange -> {
                    CorsConfiguration conf = new CorsConfiguration();
                    conf.addAllowedOriginPattern("*");
                    conf.addAllowedMethod("*");
                    conf.addAllowedHeader("*");
                    conf.setAllowCredentials(false);
                    return conf;
                }))
                .securityMatcher(new PathPatternParserServerWebExchangeMatcher("/api/**"))
                .authorizeExchange(exchanges -> exchanges
                        .pathMatchers(HttpMethod.OPTIONS, "/api/**").permitAll()
                        .pathMatchers("/api/v1/account/login/access-token").permitAll()
                        .pathMatchers("/api/v1/account/signup").permitAll()
                        .pathMatchers("/api/v1/organization/**").hasRole("ORGANIZATION_ADMIN")
                        .pathMatchers("/api/**").authenticated()
                )
                .addFilterAt(new BearerTokenAuthenticationFilter(jwtTokenService), SecurityWebFiltersOrder.AUTHENTICATION)
                .exceptionHandling(exceptionHandlingSpec -> {
                    exceptionHandlingSpec.accessDeniedHandler((exchange, e) -> Mono.error(new CustomRuntimeException(ResultCode.ACCESS_DENIED, e)));
                    exceptionHandlingSpec.authenticationEntryPoint((exchange, e) -> Mono.error(new CustomRuntimeException(ResultCode.AUTHENTICATION_FAILED, e)));
                })
                .formLogin(ServerHttpSecurity.FormLoginSpec::disable)
                .httpBasic(ServerHttpSecurity.HttpBasicSpec::disable)
                .build();
    }
}