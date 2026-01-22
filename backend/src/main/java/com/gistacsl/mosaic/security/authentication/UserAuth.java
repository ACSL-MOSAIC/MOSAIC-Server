package com.gistacsl.mosaic.security.authentication;

import com.gistacsl.mosaic.common.enumerate.ResultCode;
import com.gistacsl.mosaic.common.exception.CustomException;
import lombok.Getter;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.security.core.context.SecurityContext;
import reactor.core.publisher.Mono;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public class UserAuth implements Authentication {
    @Getter
    private final UUID userPk;
    @Getter
    private final String organization;
    private final Collection<GrantedAuthority> authorities;
    private boolean authenticated;

    public UserAuth(UUID userPk, String organization, String role) {
        this.userPk = userPk;
        this.organization = organization;
        this.authorities = List.of(new SimpleGrantedAuthority(role));
        this.authenticated = true;
    }

    public static Mono<UserAuth> getUserAuthFromSecurityContextHolder() {
        return ReactiveSecurityContextHolder.getContext()
                .map(SecurityContext::getAuthentication)
                .switchIfEmpty(Mono.error(new CustomException(ResultCode.CANNOT_FIND_USER_AUTH_FROM_CONTEXT)))
                .map(authentication -> (UserAuth) authentication);
    }

    @Override
    public String getName() {
        return this.userPk.toString();
    }

    @Override
    public UUID getPrincipal() {
        return this.userPk;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return this.authorities;
    }

    @Override
    public String getCredentials() {
        return null;
    }

    @Override
    public Object getDetails() {
        return null;
    }

    @Override
    public boolean isAuthenticated() {
        return this.authenticated;
    }

    @Override
    public void setAuthenticated(boolean isAuthenticated) throws IllegalArgumentException {
        this.authenticated = isAuthenticated;
    }
}
