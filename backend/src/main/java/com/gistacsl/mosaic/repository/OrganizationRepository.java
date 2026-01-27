package com.gistacsl.mosaic.repository;

import com.gistacsl.mosaic.common.enumerate.ResultCode;
import com.gistacsl.mosaic.common.exception.CustomException;
import com.gistacsl.mosaic.repository.entity.OrganizationEntity;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Mono;

import java.util.UUID;

import static com.gistacsl.mosaic.jooq.tables.Organization.ORGANIZATION;

@Repository
public class OrganizationRepository {

    public Mono<UUID> insertOrganization(OrganizationEntity organization, DSLContext dslContext) {
        return Mono.from(dslContext.insertInto(ORGANIZATION)
                        .set(ORGANIZATION.PK, organization.getPk())
                        .set(ORGANIZATION.NAME, organization.getName())
                        .set(ORGANIZATION.CREATED_AT, organization.getCreatedAt())
                        .set(ORGANIZATION.UPDATED_AT, organization.getUpdatedAt())
                        .returning(ORGANIZATION.PK))
                .onErrorMap(e -> new CustomException(ResultCode.DB_ORGANIZATION_CREATE_FAILED, e))
                .map(record -> record.get(ORGANIZATION.PK));
    }

    public Mono<OrganizationEntity> findByPk(UUID pk, DSLContext dslContext) {
        return Mono.from(
                dslContext.selectFrom(ORGANIZATION)
                        .where(ORGANIZATION.PK.eq(pk))
        ).onErrorMap(e -> new CustomException(ResultCode.DB_ORGANIZATION_READ_FAILED, e))
        .map(record -> OrganizationEntity.builder()
                .pk(record.getPk())
                .name(record.getName())
                .createdAt(record.getCreatedAt())
                .updatedAt(record.getUpdatedAt())
                .build()
        );
    }
}