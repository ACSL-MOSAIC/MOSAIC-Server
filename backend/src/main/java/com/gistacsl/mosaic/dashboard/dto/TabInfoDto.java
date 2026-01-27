package com.gistacsl.mosaic.dashboard.dto;

import java.util.UUID;

public class TabInfoDto {

    public record Res(
            UUID id,
            String name
    ) {}
}