package com.gistacsl.mosaic.repository;

import com.gistacsl.mosaic.common.enumerate.ResultCode;
import com.gistacsl.mosaic.common.exception.CustomException;
import com.gistacsl.mosaic.repository.entity.OccupancyMapEntity;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.OffsetDateTime;
import java.util.UUID;

import static com.gistacsl.mosaic.jooq.Tables.OCCUPANCY_MAP;

@Repository
@RequiredArgsConstructor
public class OccupancyMapRepository {

    public Mono<UUID> insertOccupancyMap(OccupancyMapEntity occupancyMap, DSLContext dsl) {
        return Mono.from(dsl.insertInto(OCCUPANCY_MAP)
                        .set(OCCUPANCY_MAP.PK, occupancyMap.getPk())
                        .set(OCCUPANCY_MAP.ORGANIZATION_FK, occupancyMap.getOrganizationFk())
                        .set(OCCUPANCY_MAP.NAME, occupancyMap.getName())
                        .set(OCCUPANCY_MAP.PGM_FILE_PATH, occupancyMap.getPgmFilePath())
                        .set(OCCUPANCY_MAP.YAML_FILE_PATH, occupancyMap.getYamlFilePath())
                        .set(OCCUPANCY_MAP.CREATED_AT, occupancyMap.getCreatedAt())
                        .set(OCCUPANCY_MAP.UPDATED_AT, occupancyMap.getUpdatedAt())
                        .returning(OCCUPANCY_MAP.PK))
                .onErrorMap(e -> new CustomException(ResultCode.DB_OCCUPANCY_MAP_CREATE_FAILED, e))
                .map(record -> record.get(OCCUPANCY_MAP.PK));
    }

    /*
    select pk, organization_fk, name, pgm_file_path, yaml_file_path, created_at, updated_at
    from occupancy_map
    where pk = ? and organization_fk = ?
     */
    public Mono<OccupancyMapEntity> findByPkAndOrganizationFk(UUID pk, UUID organizationFk, DSLContext dsl) {
        return Mono.from(dsl.select(
                                OCCUPANCY_MAP.PK,
                                OCCUPANCY_MAP.ORGANIZATION_FK,
                                OCCUPANCY_MAP.NAME,
                                OCCUPANCY_MAP.PGM_FILE_PATH,
                                OCCUPANCY_MAP.YAML_FILE_PATH,
                                OCCUPANCY_MAP.CREATED_AT,
                                OCCUPANCY_MAP.UPDATED_AT)
                        .from(OCCUPANCY_MAP)
                        .where(OCCUPANCY_MAP.PK.eq(pk))
                        .and(OCCUPANCY_MAP.ORGANIZATION_FK.eq(organizationFk)))
                .onErrorMap(e -> new CustomException(ResultCode.DB_OCCUPANCY_MAP_READ_FAILED, e))
                .map(record -> OccupancyMapEntity.builder()
                        .pk(record.get(OCCUPANCY_MAP.PK))
                        .organizationFk(record.get(OCCUPANCY_MAP.ORGANIZATION_FK))
                        .name(record.get(OCCUPANCY_MAP.NAME))
                        .pgmFilePath(record.get(OCCUPANCY_MAP.PGM_FILE_PATH))
                        .yamlFilePath(record.get(OCCUPANCY_MAP.YAML_FILE_PATH))
                        .createdAt(record.get(OCCUPANCY_MAP.CREATED_AT))
                        .updatedAt(record.get(OCCUPANCY_MAP.UPDATED_AT))
                        .build());
    }

    /*
    select pk, organization_fk, name, pgm_file_path, yaml_file_path, created_at, updated_at
    from occupancy_map
    where organization_fk = ? order by created_at desc limit ? offset ?
     */
    public Flux<OccupancyMapEntity> findAllByOrganizationFk(UUID organizationFk, int skip, int limit, DSLContext dsl) {
        return Flux.from(dsl.select(
                                OCCUPANCY_MAP.PK,
                                OCCUPANCY_MAP.ORGANIZATION_FK,
                                OCCUPANCY_MAP.NAME,
                                OCCUPANCY_MAP.PGM_FILE_PATH,
                                OCCUPANCY_MAP.YAML_FILE_PATH,
                                OCCUPANCY_MAP.CREATED_AT,
                                OCCUPANCY_MAP.UPDATED_AT)
                        .from(OCCUPANCY_MAP)
                        .where(OCCUPANCY_MAP.ORGANIZATION_FK.eq(organizationFk))
                        .orderBy(OCCUPANCY_MAP.CREATED_AT.desc())
                        .offset(skip)
                        .limit(limit))
                .onErrorMap(e -> new CustomException(ResultCode.DB_OCCUPANCY_MAP_READ_FAILED, e))
                .map(record -> OccupancyMapEntity.builder()
                        .pk(record.get(OCCUPANCY_MAP.PK))
                        .organizationFk(record.get(OCCUPANCY_MAP.ORGANIZATION_FK))
                        .name(record.get(OCCUPANCY_MAP.NAME))
                        .pgmFilePath(record.get(OCCUPANCY_MAP.PGM_FILE_PATH))
                        .yamlFilePath(record.get(OCCUPANCY_MAP.YAML_FILE_PATH))
                        .createdAt(record.get(OCCUPANCY_MAP.CREATED_AT))
                        .updatedAt(record.get(OCCUPANCY_MAP.UPDATED_AT))
                        .build());
    }

    public Mono<Integer> countByOrganizationFk(UUID organizationFk, DSLContext dsl) {
        return Mono.from(dsl.selectCount()
                        .from(OCCUPANCY_MAP)
                        .where(OCCUPANCY_MAP.ORGANIZATION_FK.eq(organizationFk)))
                .onErrorMap(e -> new CustomException(ResultCode.DB_OCCUPANCY_MAP_READ_FAILED, e))
                .map(record -> record.get(0, Integer.class));
    }

    public Mono<UUID> updateOccupancyMap(UUID pk, UUID organizationFk, String name, String pgmFilePath, String yamlFilePath, DSLContext dsl) {
        var updateStep = dsl.update(OCCUPANCY_MAP)
                .set(OCCUPANCY_MAP.UPDATED_AT, OffsetDateTime.now());

        if (name != null) {
            updateStep = updateStep.set(OCCUPANCY_MAP.NAME, name);
        }
        if (pgmFilePath != null) {
            updateStep = updateStep.set(OCCUPANCY_MAP.PGM_FILE_PATH, pgmFilePath);
        }
        if (yamlFilePath != null) {
            updateStep = updateStep.set(OCCUPANCY_MAP.YAML_FILE_PATH, yamlFilePath);
        }

        return Mono.from(updateStep
                        .where(OCCUPANCY_MAP.PK.eq(pk))
                        .and(OCCUPANCY_MAP.ORGANIZATION_FK.eq(organizationFk)))
                .onErrorMap(e -> new CustomException(ResultCode.DB_OCCUPANCY_MAP_UPDATE_FAILED, e))
                .map(rowsAffected -> pk);
    }

    public Mono<Integer> deleteByPkAndOrganizationFk(UUID pk, UUID organizationFk, DSLContext dsl) {
        return Mono.from(dsl.deleteFrom(OCCUPANCY_MAP)
                        .where(OCCUPANCY_MAP.PK.eq(pk))
                        .and(OCCUPANCY_MAP.ORGANIZATION_FK.eq(organizationFk)))
                .onErrorMap(e -> new CustomException(ResultCode.DB_OCCUPANCY_MAP_DELETE_FAILED, e));
    }
}