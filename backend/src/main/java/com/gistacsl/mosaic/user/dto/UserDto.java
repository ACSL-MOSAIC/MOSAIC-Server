package com.gistacsl.mosaic.user.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public class UserDto {

    public record Res(
            UUID id,
            String email,
            Boolean isActive,
            Boolean isOrganizationAdmin,
            String fullName,
            OffsetDateTime createdAt,
            OffsetDateTime updatedAt
    ) {
    }
}