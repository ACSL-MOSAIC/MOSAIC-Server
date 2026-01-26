package com.gistacsl.mosaic.dashboard.dto;

import java.util.UUID;

public class TabConfigDto {

    public record Res(
            UUID id,
            String name,
            String widgets
    ) {
    }
}