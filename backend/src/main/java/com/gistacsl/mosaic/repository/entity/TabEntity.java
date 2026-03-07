package com.gistacsl.mosaic.repository.entity;

import java.time.OffsetDateTime;
import java.util.UUID;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class TabEntity {
  @Builder.Default private UUID pk = UUID.randomUUID();
  private UUID organizationFk;
  private String name;
  private String tabConfig;

  @Builder.Default private OffsetDateTime createdAt = OffsetDateTime.now();
  @Builder.Default private OffsetDateTime updatedAt = OffsetDateTime.now();
}
