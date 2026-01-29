package com.gistacsl.mosaic.repository.entity;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.OffsetDateTime;
import java.util.UUID;

@Getter
@Setter
@Builder
public class KeyPairEntity {
    @Builder.Default
    private UUID pk = UUID.randomUUID();

    private String purpose;

    @Builder.Default
    private String algorithm = "RSA";

    @Builder.Default
    private Integer keySize = 2048;

    private String publicKey;
    private String encryptedPrivateKey;

    @Builder.Default
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @Builder.Default
    private OffsetDateTime updatedAt = OffsetDateTime.now();
}