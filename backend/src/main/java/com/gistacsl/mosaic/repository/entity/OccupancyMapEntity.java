package com.gistacsl.mosaic.repository.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OccupancyMapEntity {
    @Builder.Default
    private UUID pk = UUID.randomUUID();
    private UUID organizationFk;
    private String name;
    private String pgmFilePath;
    private String yamlFilePath;

    @Builder.Default
    private OffsetDateTime createdAt = OffsetDateTime.now();
    @Builder.Default
    private OffsetDateTime updatedAt = OffsetDateTime.now();
}
