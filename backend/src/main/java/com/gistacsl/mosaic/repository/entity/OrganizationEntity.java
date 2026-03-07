package com.gistacsl.mosaic.repository.entity;

import java.time.OffsetDateTime;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrganizationEntity {
  private UUID pk;
  private String name;
  private OffsetDateTime createdAt;
  private OffsetDateTime updatedAt;
}
