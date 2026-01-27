package com.gistacsl.mosaic.occupancy_map.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public class OccupancyMapDto {

    public record Res(
            UUID id,
            String name,
            String pgmFilePath,
            String yamlFilePath,
            OffsetDateTime createdAt,
            OffsetDateTime updatedAt
    ) {
    }
}