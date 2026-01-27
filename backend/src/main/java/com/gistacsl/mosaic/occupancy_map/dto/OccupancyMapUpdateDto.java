package com.gistacsl.mosaic.occupancy_map.dto;

public class OccupancyMapUpdateDto {

    public record Req(
            String name,
            String pgmFilePath,
            String yamlFilePath
    ) {
    }
}