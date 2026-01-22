package com.gistacsl.mosaic.security.jwt;

import com.gistacsl.mosaic.common.enumerate.ResultCode;
import com.gistacsl.mosaic.common.exception.CustomException;
import com.gistacsl.mosaic.security.authentication.UserAuth;
import com.gistacsl.mosaic.security.jwt.cryptor.MosaicKey;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.io.DecodingException;
import io.jsonwebtoken.security.SignatureException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class JwtTokenService {
    private final MosaicKey mosaicKey;
    private final AccessToken accessToken;
    private final RefreshToken refreshToken;

    public UserAuth getUserAuthFromToken(String token) throws Exception {
        Claims payload;
        try {
            payload = accessToken.getTokenPayload(token, mosaicKey.getPublicKey());

            String userPk = accessToken.getUserPk(payload);
            String organization = accessToken.getOrganize(payload);
            String role = accessToken.getRole(payload);

            return new UserAuth(UUID.fromString(userPk), organization, role);
        } catch (ExpiredJwtException e) {
            throw new CustomException(ResultCode.ACCESS_TOKEN_EXPIRED, e);
        } catch (SignatureException e) {
            throw new CustomException(ResultCode.ACCESS_TOKEN_DECRYPTING_FAILED, e);
        } catch (MalformedJwtException | DecodingException e) {
            throw new CustomException(ResultCode.ACCESS_TOKEN_NOT_EXIST, e);
        } catch (Exception e) {
            throw new CustomException(ResultCode.UNKNOWN_EXCEPTION_OCCURRED, e);
        }
    }
}
