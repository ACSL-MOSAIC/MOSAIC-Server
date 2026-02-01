package com.gistacsl.mosaic.security.jwt;

import com.gistacsl.mosaic.common.enumerate.ResultCode;
import com.gistacsl.mosaic.common.exception.CustomException;
import com.gistacsl.mosaic.cryptor.MosaicKeyService;
import com.gistacsl.mosaic.security.jwt.dto.JwtPayload;
import io.jsonwebtoken.*;
import io.jsonwebtoken.io.DecodingException;
import io.jsonwebtoken.security.SignatureException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Date;

@Component
@RequiredArgsConstructor
public class RefreshToken extends JsonWebToken {
    private final MosaicKeyService mosaicKeyService;

    @Value("${jwt.refresh-token.expiration-time}")
    private long refresh_token_validation_time;

    @Override
    public Claims makePayload(JwtPayload jwtPayload) {
        ClaimsBuilder claimsBuilder = Jwts.claims();

        claimsBuilder.add(super.payload_user, jwtPayload.userPk());
        claimsBuilder.add(super.payload_organization, jwtPayload.organizationPk());

        return claimsBuilder.build();
    }

    @Override
    public String issueToken(JwtPayload jwtPayload) throws CustomException {
        Claims claims = this.makePayload(jwtPayload);

        try {
            return super.doGenerateToken(claims, refresh_token_validation_time, mosaicKeyService.getPrivateKey(MosaicKeyService.PURPOSE_JWT));
        } catch (Exception e) {
            throw new CustomException(ResultCode.REFRESH_TOKEN_GENERATION_FAILED);
        }
    }

    public Claims getRefreshTokenPayload(String token) throws CustomException {
        try {
            return super.getTokenPayload(token, mosaicKeyService.getPublicKey(MosaicKeyService.PURPOSE_JWT));
        } catch (ExpiredJwtException e) {
            throw new CustomException(ResultCode.REFRESH_TOKEN_EXPIRED);
        } catch (SignatureException e) {
            throw new CustomException(ResultCode.REFRESH_TOKEN_DECRYPTING_FAILED);
        } catch (MalformedJwtException | DecodingException e) {
            throw new CustomException(ResultCode.JWT_TOKEN_NOT_SUPPORTED);
        }
    }


    public Boolean verifyRefreshTokenPayload(Claims tokenClaims, JwtPayload jwtPayload) {

        Date expiration = tokenClaims.getExpiration();
        if (expiration.before(new Date())) {
            return false;
        }

        String userId = tokenClaims.get(super.payload_user, String.class);
        String organization = tokenClaims.get(super.payload_organization, String.class);

        return userId.equals(jwtPayload.userPk()) && organization.equals(jwtPayload.organizationPk());
    }

    public String getUserId(Claims tokenClaims) {
        return tokenClaims.get(super.payload_user, String.class);
    }

    public String getOrganize(Claims tokenClaims) {
        return tokenClaims.get(super.payload_organization, String.class);
    }

    public String getRole(Claims tokenClaims) {
        return tokenClaims.get(super.payload_role, String.class);
    }
}
