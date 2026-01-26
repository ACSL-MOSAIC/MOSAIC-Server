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
public class UserEntity {
    private UUID pk;
    private UUID organizationFk;
    private Boolean isActive;
    private Boolean isOrganizationAdmin;
    private String email;
    private String fullName;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
    private String hashedPassword;
}