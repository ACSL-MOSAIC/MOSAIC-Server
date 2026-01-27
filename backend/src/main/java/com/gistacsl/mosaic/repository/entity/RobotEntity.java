package com.gistacsl.mosaic.repository.entity;

import com.gistacsl.mosaic.robot.enumerate.RobotStatus;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.OffsetDateTime;
import java.util.UUID;

@Getter
@Setter
@Builder
public class RobotEntity {
    @Builder.Default
    private UUID pk = UUID.randomUUID();
    private UUID organizationFk;
    @Builder.Default
    private RobotStatus status = RobotStatus.DISCONNECTED;
    private String name;
    private String description;

    @Builder.Default
    private OffsetDateTime createdAt = OffsetDateTime.now();
    @Builder.Default
    private OffsetDateTime updatedAt = OffsetDateTime.now();
}