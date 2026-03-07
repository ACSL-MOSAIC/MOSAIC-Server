package com.gistacsl.mosaic.security.jwt;

import java.util.UUID;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.io.DecodingException;
import io.jsonwebtoken.security.SignatureException;
import lombok.RequiredArgsConstructor;

import com.gistacsl.mosaic.common.enumerate.ResultCode;
import com.gistacsl.mosaic.common.exception.CustomException;
import com.gistacsl.mosaic.cryptor.MosaicKeyService;
import com.gistacsl.mosaic.security.authentication.UserAuth;

import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class JwtTokenService {
  private final MosaicKeyService mosaicKeyService;
  private final AccessToken accessToken;
  private final RefreshToken refreshToken;

  public UserAuth getUserAuthFromToken(String token) throws Exception {
    Claims payload;
    try {
      payload =
          accessToken.getTokenPayload(
              token, mosaicKeyService.getPublicKey(MosaicKeyService.PURPOSE_JWT));

      String userPk = accessToken.getUserPk(payload);
      String organizationPk = accessToken.getOrganizePk(payload);
      String role = accessToken.getRole(payload);

      return new UserAuth(UUID.fromString(userPk), UUID.fromString(organizationPk), role);
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
