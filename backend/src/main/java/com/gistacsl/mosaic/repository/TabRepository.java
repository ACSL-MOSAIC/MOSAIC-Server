package com.gistacsl.mosaic.repository;

import com.gistacsl.mosaic.common.enumerate.ResultCode;
import com.gistacsl.mosaic.common.exception.CustomException;
import com.gistacsl.mosaic.repository.entity.TabEntity;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.jooq.JSON;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

import static com.gistacsl.mosaic.jooq.Tables.TAB;

@Repository
@RequiredArgsConstructor
public class TabRepository {

    /*
    select pk, organization_fk, name, created_at, updated_at
    from tab
    where organization_fk = ?
     */
    public Flux<TabEntity> findAllByOrganizationFkWithoutConfig(UUID organizationFk, DSLContext dsl) {
        return Flux.from(dsl.select(
                                TAB.PK,
                                TAB.ORGANIZATION_FK,
                                TAB.NAME,
                                TAB.CREATED_AT,
                                TAB.UPDATED_AT)
                        .from(TAB)
                        .where(TAB.ORGANIZATION_FK.eq(organizationFk)))
                .onErrorMap(e -> new CustomException(ResultCode.DB_TAB_READ_FAILED, e))
                .map(record -> TabEntity.builder()
                        .pk(record.get(TAB.PK))
                        .organizationFk(record.get(TAB.ORGANIZATION_FK))
                        .name(record.get(TAB.NAME))
                        .createdAt(record.get(TAB.CREATED_AT))
                        .updatedAt(record.get(TAB.UPDATED_AT))
                        .build());
    }

    public Mono<UUID> insertTab(TabEntity tab, DSLContext dsl) {
        return Mono.from(dsl.insertInto(TAB)
                        .set(TAB.PK, tab.getPk())
                        .set(TAB.ORGANIZATION_FK, tab.getOrganizationFk())
                        .set(TAB.NAME, tab.getName())
                        .set(TAB.TAB_CONFIG, JSON.json(tab.getTabConfig()))
                        .set(TAB.CREATED_AT, tab.getCreatedAt())
                        .set(TAB.UPDATED_AT, tab.getUpdatedAt())
                        .returning(TAB.PK))
                .onErrorMap(e -> new CustomException(ResultCode.DB_TAB_CREATE_FAILED, e))
                .map(record -> record.get(TAB.PK));
    }

    /*
    select pk, organization_fk, name, tab_config, created_at, updated_at
    from tab
    where pk = ? and organization_fk = ?
     */
    public Mono<TabEntity> findByPkAndOrganizationFk(UUID pk, UUID organizationFk, DSLContext dsl) {
        return Mono.from(dsl.select(
                                TAB.PK,
                                TAB.ORGANIZATION_FK,
                                TAB.NAME,
                                TAB.TAB_CONFIG,
                                TAB.CREATED_AT,
                                TAB.UPDATED_AT)
                        .from(TAB)
                        .where(TAB.PK.eq(pk))
                        .and(TAB.ORGANIZATION_FK.eq(organizationFk)))
                .onErrorMap(e -> new CustomException(ResultCode.DB_TAB_READ_FAILED, e))
                .map(record -> TabEntity.builder()
                        .pk(record.get(TAB.PK))
                        .organizationFk(record.get(TAB.ORGANIZATION_FK))
                        .name(record.get(TAB.NAME))
                        .tabConfig(record.get(TAB.TAB_CONFIG).data())
                        .createdAt(record.get(TAB.CREATED_AT))
                        .updatedAt(record.get(TAB.UPDATED_AT))
                        .build());
    }

    public Mono<UUID> updateTabName(UUID pk, UUID organizationFk, String name, DSLContext dsl) {
        return Mono.from(dsl.update(TAB)
                        .set(TAB.NAME, name)
                        .where(TAB.PK.eq(pk))
                        .and(TAB.ORGANIZATION_FK.eq(organizationFk)))
                .onErrorMap(e -> new CustomException(ResultCode.DB_TAB_UPDATE_FAILED, e))
                .flatMap(rowsAffected -> {
                    if (rowsAffected == 0) {
                        return Mono.error(new CustomException(ResultCode.DB_TAB_UPDATE_FAILED));
                    }
                    return Mono.just(pk);
                });
    }

    public Mono<UUID> updateTabConfig(UUID pk, UUID organizationFk, String tabConfig, DSLContext dsl) {
        return Mono.from(dsl.update(TAB)
                        .set(TAB.TAB_CONFIG, JSON.json(tabConfig))
                        .where(TAB.PK.eq(pk))
                        .and(TAB.ORGANIZATION_FK.eq(organizationFk)))
                .onErrorMap(e -> new CustomException(ResultCode.DB_TAB_UPDATE_FAILED, e))
                .flatMap(rowsAffected -> {
                    if (rowsAffected == 0) {
                        return Mono.error(new CustomException(ResultCode.DB_TAB_UPDATE_FAILED));
                    }
                    return Mono.just(pk);
                });
    }

    public Mono<Integer> deleteByPkAndOrganizationFk(UUID pk, UUID organizationFk, DSLContext dsl) {
        return Mono.from(dsl.deleteFrom(TAB)
                        .where(TAB.PK.eq(pk))
                        .and(TAB.ORGANIZATION_FK.eq(organizationFk)))
                .onErrorMap(e -> new CustomException(ResultCode.DB_TAB_DELETE_FAILED, e));
    }
}
