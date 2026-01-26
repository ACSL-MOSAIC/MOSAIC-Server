package com.gistacsl.mosaic.security.jwt;

import com.gistacsl.mosaic.common.exception.CustomException;
import com.gistacsl.mosaic.security.jwt.dto.JwtPayload;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;

import java.security.PrivateKey;
import java.security.PublicKey;
import java.util.Date;


public abstract class JsonWebToken {

    protected final String payload_user = "userId";
    protected final String payload_organization = "organizationPk";
    protected final String payload_role = "role";
    private final String iss = "MosaicBackend";

    public String doGenerateToken(Claims claims, long expireTime, PrivateKey privateKey) {
        return Jwts.builder()
                .claims(claims)
                .issuer(iss)
                .issuedAt(new Date(System.currentTimeMillis()))
                .expiration(new Date(System.currentTimeMillis() + expireTime))
                .signWith(privateKey)
                .compact();
    }

    protected abstract Claims makePayload(JwtPayload jwtPayload);

    public abstract String issueToken(JwtPayload jwtPayload) throws CustomException;


    public Claims getTokenPayload(String token, PublicKey publicKey) {
        return Jwts.parser()
                .verifyWith(publicKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
