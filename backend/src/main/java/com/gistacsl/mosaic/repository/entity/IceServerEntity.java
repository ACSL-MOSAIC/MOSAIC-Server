package com.gistacsl.mosaic.repository.entity;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.OffsetDateTime;
import java.util.UUID;

@Getter
@Setter
@Builder
public class IceServerEntity {
    @Builder.Default
    private UUID pk = UUID.randomUUID();

    private String urls;
    private String username;
    private String credential;

    @Builder.Default
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @Builder.Default
    private OffsetDateTime updatedAt = OffsetDateTime.now();
}