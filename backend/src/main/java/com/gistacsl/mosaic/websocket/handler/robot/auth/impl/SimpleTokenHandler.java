package com.gistacsl.mosaic.websocket.handler.robot.auth.impl;

import com.gistacsl.mosaic.common.enumerate.ResultCode;
import com.gistacsl.mosaic.common.exception.CustomException;
import com.gistacsl.mosaic.cryptor.KeyEncryptionService;
import com.gistacsl.mosaic.repository.entity.RobotEntity;
import com.gistacsl.mosaic.robot.enumerate.RobotAuthType;
import com.gistacsl.mosaic.websocket.handler.robot.auth.MosaicBaseAuthHandler;
import com.gistacsl.mosaic.websocket.handler.robot.auth.RobotAuthHandler;
import com.gistacsl.mosaic.websocket.handler.robot.dto.RobotAuthorizeWsDto;
import com.gistacsl.mosaic.websocket.session.RobotWsSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;

import java.security.SecureRandom;
import java.util.Arrays;
import java.util.Base64;
import java.util.UUID;

@Slf4j
@RobotAuthHandler(RobotAuthType.SIMPLE_TOKEN)
@RequiredArgsConstructor
public class SimpleTokenHandler implements MosaicBaseAuthHandler {

    private final KeyEncryptionService keyEncryptionService;

    @Override
    public Mono<Void> handleMessage(RobotAuthorizeWsDto<?> message, RobotEntity robot, RobotWsSession session) throws CustomException {
        try {
            // Extract token from message data
            if (!(message.getData() instanceof String token)) {
                log.error("Invalid token format: expected String, got {}", message.getData().getClass());
                throw new CustomException(ResultCode.AUTHENTICATION_FAILED);
            }

            // Validate token
            validateToken(token, robot.getPk());

            // If validation succeeds, authenticate the session
            session.authenticated(robot.getPk(), robot.getOrganizationFk());
            return Mono.empty();
        } catch (CustomException e) {
            throw e;
        } catch (Exception e) {
            log.error("Token validation failed", e);
            throw new CustomException(ResultCode.AUTHENTICATION_FAILED, e);
        }
    }

    /**
     * Generate a token for a robot
     * Token format: Base64(encrypted_payload).Base64(hmac)
     * Payload format: robotPk|timestamp|nonce
     */
    public String generateToken(RobotEntity robot) {
        try {
            long timestamp = System.currentTimeMillis();
            byte[] nonceBytes = new byte[16];
            new SecureRandom().nextBytes(nonceBytes);
            String nonce = Base64.getEncoder().encodeToString(nonceBytes);

            // Create payload: robotPk|timestamp|nonce
            String payload = robot.getPk().toString() + "|" + timestamp + "|" + nonce;
            byte[] payloadBytes = payload.getBytes();

            // Encrypt payload
            byte[] encryptedPayload = keyEncryptionService.encrypt(payloadBytes);

            // Generate HMAC
            byte[] hmac = keyEncryptionService.generateHmac(payloadBytes);

            // Combine: Base64(encrypted).Base64(hmac)
            String encryptedPart = Base64.getEncoder().encodeToString(encryptedPayload);
            String hmacPart = Base64.getEncoder().encodeToString(hmac);

            return encryptedPart + "." + hmacPart;
        } catch (Exception e) {
            log.error("Failed to generate token for robot {}", robot.getPk(), e);
            throw new RuntimeException("Token generation failed", e);
        }
    }

    /**
     * Validate token and verify it matches the expected robot
     */
    private void validateToken(String token, UUID expectedRobotPk) throws Exception {
        // Split token into encrypted payload and HMAC
        String[] parts = token.split("\\.");
        if (parts.length != 2) {
            log.error("Invalid token format: expected 2 parts, got {}", parts.length);
            throw new CustomException(ResultCode.AUTHENTICATION_FAILED);
        }

        byte[] encryptedPayload = Base64.getDecoder().decode(parts[0]);
        byte[] receivedHmac = Base64.getDecoder().decode(parts[1]);

        // Decrypt payload
        String decryptedPayload = keyEncryptionService.decrypt(encryptedPayload);

        // Parse payload: robotPk|timestamp|nonce
        String[] payloadParts = decryptedPayload.split("\\|");
        if (payloadParts.length != 3) {
            log.error("Invalid payload format: expected 3 parts, got {}", payloadParts.length);
            throw new CustomException(ResultCode.AUTHENTICATION_FAILED);
        }

        UUID robotPk = UUID.fromString(payloadParts[0]);
        long timestamp = Long.parseLong(payloadParts[1]);

        // Verify HMAC
        byte[] expectedHmac = keyEncryptionService.generateHmac(decryptedPayload.getBytes());
        if (!Arrays.equals(expectedHmac, receivedHmac)) {
            log.error("HMAC verification failed: token has been tampered");
            throw new CustomException(ResultCode.AUTHENTICATION_FAILED);
        }

        // Verify robot PK matches
        if (!robotPk.equals(expectedRobotPk)) {
            log.error("Robot PK mismatch: expected {}, got {}", expectedRobotPk, robotPk);
            throw new CustomException(ResultCode.AUTHENTICATION_FAILED);
        }

        log.debug("Token validated successfully for robot {}", robotPk);
    }
}
