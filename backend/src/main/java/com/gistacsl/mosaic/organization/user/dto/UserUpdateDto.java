package com.gistacsl.mosaic.organization.user.dto;

import java.util.UUID;

public class UserUpdateDto {

    public record Req(
            UUID id,
            String password,
            Boolean isActive,
            Boolean isOrganizationAdmin,
            String fullName
    ) {
    }
}