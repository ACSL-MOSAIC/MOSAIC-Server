package com.gistacsl.mosaic.security.jwt.dto;

public record JwtPayload(
        String userPk,
        String organization,
        String role
) {
}
