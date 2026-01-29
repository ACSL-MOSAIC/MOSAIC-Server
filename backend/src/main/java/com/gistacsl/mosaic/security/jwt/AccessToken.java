package com.gistacsl.mosaic.security.jwt;

import com.gistacsl.mosaic.common.enumerate.ResultCode;
import com.gistacsl.mosaic.common.exception.CustomException;
import com.gistacsl.mosaic.cryptor.MosaicKeyService;
import com.gistacsl.mosaic.security.jwt.dto.JwtPayload;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ClaimsBuilder;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.SignatureException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Date;

@Component
@RequiredArgsConstructor
public class AccessToken extends JsonWebToken {
    private final MosaicKeyService mosaicKeyService;

    @Value("${jwt.access-token.expiration-time}")
    private long access_token_validation_time;

    @Override
    public Claims makePayload(JwtPayload jwtPayload) {
        ClaimsBuilder claimsBuilder = Jwts.claims();

        claimsBuilder.add(super.payload_user, jwtPayload.userPk());
        claimsBuilder.add(super.payload_organization, jwtPayload.organizationPk());
        claimsBuilder.add(super.payload_role, jwtPayload.role());

        return claimsBuilder.build();
    }

    @Override
    public String issueToken(JwtPayload jwtPayload) throws CustomException {
        Claims claims = this.makePayload(jwtPayload);

        try {
            return super.doGenerateToken(claims, access_token_validation_time, mosaicKeyService.getPrivateKey(MosaicKeyService.PURPOSE_JWT));
        } catch (Exception e) {
            throw new CustomException(ResultCode.ACCESS_TOKEN_GENERATION_FAILED, e);
        }
    }

    public Claims getAccessTokenPayload(String token) throws CustomException {
        try {
            return super.getTokenPayload(token, mosaicKeyService.getPublicKey(MosaicKeyService.PURPOSE_JWT));
        } catch (ExpiredJwtException e) {
            throw new CustomException(ResultCode.ACCESS_TOKEN_EXPIRED, e);
        } catch (SignatureException e) {
            throw new CustomException(ResultCode.ACCESS_TOKEN_DECRYPTING_FAILED, e);
        }
    }

    public Boolean verifyAccessTokenPayload(Claims tokenClaims, JwtPayload jwtPayload) {
        Date expiration = tokenClaims.getExpiration();
        if (expiration.before(new Date())) {
            return false;
        }

        String userPk = tokenClaims.get(super.payload_user, String.class);
        String organizationPk = tokenClaims.get(super.payload_organization, String.class);
        String role = tokenClaims.get(super.payload_role, String.class);

        return userPk.equals(jwtPayload.userPk()) && organizationPk.equals(jwtPayload.organizationPk()) && role != null;
    }

    public String getUserPk(Claims tokenClaims) {
        return tokenClaims.get(super.payload_user, String.class);
    }

    public String getOrganizePk(Claims tokenClaims) {
        return tokenClaims.get(super.payload_organization, String.class);
    }

    public String getRole(Claims tokenClaims) {
        return tokenClaims.get(super.payload_role, String.class);
    }
}
