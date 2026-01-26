package com.gistacsl.mosaic.repository;

import com.gistacsl.mosaic.common.enumerate.ResultCode;
import com.gistacsl.mosaic.common.exception.CustomException;
import com.gistacsl.mosaic.repository.entity.RobotEntity;
import com.gistacsl.mosaic.robot.enumerate.RobotStatus;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.OffsetDateTime;
import java.util.UUID;

import static com.gistacsl.mosaic.jooq.Tables.ROBOT;

@Repository
@RequiredArgsConstructor
public class RobotRepository {

    public Mono<UUID> insertRobot(RobotEntity robot, DSLContext dsl) {
        return Mono.from(dsl.insertInto(ROBOT)
                        .set(ROBOT.PK, robot.getPk())
                        .set(ROBOT.ORGANIZATION_FK, robot.getOrganizationFk())
                        .set(ROBOT.STATUS, robot.getStatus().name())
                        .set(ROBOT.NAME, robot.getName())
                        .set(ROBOT.DESCRIPTION, robot.getDescription())
                        .set(ROBOT.CREATED_AT, robot.getCreatedAt())
                        .set(ROBOT.UPDATED_AT, robot.getUpdatedAt())
                        .returning(ROBOT.PK))
                .onErrorMap(e -> new CustomException(ResultCode.DB_ROBOT_CREATE_FAILED, e))
                .map(record -> record.get(ROBOT.PK));
    }

    /*
    select pk, organization_fk, status, name, description, created_at, updated_at
    from robot
    where pk = ? and organization_fk = ?
    order by created_at desc
     */
    public Mono<RobotEntity> findByPkAndOrganizationFk(UUID pk, UUID organizationFk, DSLContext dsl) {
        return Mono.from(dsl.select(
                                ROBOT.PK,
                                ROBOT.ORGANIZATION_FK,
                                ROBOT.STATUS,
                                ROBOT.NAME,
                                ROBOT.DESCRIPTION,
                                ROBOT.CREATED_AT,
                                ROBOT.UPDATED_AT)
                        .from(ROBOT)
                        .where(ROBOT.PK.eq(pk))
                        .and(ROBOT.ORGANIZATION_FK.eq(organizationFk)))
                .onErrorMap(e -> new CustomException(ResultCode.DB_ROBOT_READ_FAILED, e))
                .map(record -> RobotEntity.builder()
                        .pk(record.get(ROBOT.PK))
                        .organizationFk(record.get(ROBOT.ORGANIZATION_FK))
                        .status(RobotStatus.valueOf(record.get(ROBOT.STATUS)))
                        .name(record.get(ROBOT.NAME))
                        .description(record.get(ROBOT.DESCRIPTION))
                        .createdAt(record.get(ROBOT.CREATED_AT))
                        .updatedAt(record.get(ROBOT.UPDATED_AT))
                        .build());
    }

    /*
    select pk, organization_fk, status, name, description, created_at, updated_at
    from robot
    where organization_fk = ?
    order by created_at desc
    limit ? offset ?
     */
    public Flux<RobotEntity> findAllByOrganizationFk(UUID organizationFk, int skip, int limit, DSLContext dsl) {
        return Flux.from(dsl.select(
                                ROBOT.PK,
                                ROBOT.ORGANIZATION_FK,
                                ROBOT.STATUS,
                                ROBOT.NAME,
                                ROBOT.DESCRIPTION,
                                ROBOT.CREATED_AT,
                                ROBOT.UPDATED_AT)
                        .from(ROBOT)
                        .where(ROBOT.ORGANIZATION_FK.eq(organizationFk))
                        .orderBy(ROBOT.CREATED_AT.desc())
                        .offset(skip)
                        .limit(limit))
                .onErrorMap(e -> new CustomException(ResultCode.DB_ROBOT_READ_FAILED, e))
                .map(record -> RobotEntity.builder()
                        .pk(record.get(ROBOT.PK))
                        .organizationFk(record.get(ROBOT.ORGANIZATION_FK))
                        .status(RobotStatus.valueOf(record.get(ROBOT.STATUS)))
                        .name(record.get(ROBOT.NAME))
                        .description(record.get(ROBOT.DESCRIPTION))
                        .createdAt(record.get(ROBOT.CREATED_AT))
                        .updatedAt(record.get(ROBOT.UPDATED_AT))
                        .build());
    }

    /*
    select count(*) from robot where organization_fk = ?
     */
    public Mono<Integer> countByOrganizationFk(UUID organizationFk, DSLContext dsl) {
        return Mono.from(dsl.selectCount()
                        .from(ROBOT)
                        .where(ROBOT.ORGANIZATION_FK.eq(organizationFk)))
                .onErrorMap(e -> new CustomException(ResultCode.DB_ROBOT_READ_FAILED, e))
                .map(record -> record.get(0, Integer.class));
    }

    public Mono<UUID> updateRobot(UUID pk, UUID organizationFk, String name, String description, RobotStatus status, DSLContext dsl) {
        var updateStep = dsl.update(ROBOT)
                .set(ROBOT.UPDATED_AT, OffsetDateTime.now());

        if (name != null) {
            updateStep = updateStep.set(ROBOT.NAME, name);
        }
        if (description != null) {
            updateStep = updateStep.set(ROBOT.DESCRIPTION, description);
        }
        if (status != null) {
            updateStep = updateStep.set(ROBOT.STATUS, status.name());
        }

        return Mono.from(updateStep
                        .where(ROBOT.PK.eq(pk))
                        .and(ROBOT.ORGANIZATION_FK.eq(organizationFk)))
                .onErrorMap(e -> new CustomException(ResultCode.DB_ROBOT_UPDATE_FAILED, e))
                .map(rowsAffected -> pk);
    }

    public Mono<Integer> deleteByPkAndOrganizationFk(UUID pk, UUID organizationFk, DSLContext dsl) {
        return Mono.from(dsl.deleteFrom(ROBOT)
                        .where(ROBOT.PK.eq(pk))
                        .and(ROBOT.ORGANIZATION_FK.eq(organizationFk)))
                .onErrorMap(e -> new CustomException(ResultCode.DB_ROBOT_DELETE_FAILED, e));
    }
}