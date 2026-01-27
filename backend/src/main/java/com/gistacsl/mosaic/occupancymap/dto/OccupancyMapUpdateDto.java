package com.gistacsl.mosaic.occupancymap.dto;

public class OccupancyMapUpdateDto {

    public record Req(
            String name,
            String pgmFilePath,
            String yamlFilePath
    ) {
    }
}