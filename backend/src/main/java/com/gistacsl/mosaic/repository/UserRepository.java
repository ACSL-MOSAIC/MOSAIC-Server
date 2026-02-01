package com.gistacsl.mosaic.repository;

import com.gistacsl.mosaic.common.enumerate.ResultCode;
import com.gistacsl.mosaic.common.exception.CustomException;
import com.gistacsl.mosaic.repository.entity.UserEntity;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

import static com.gistacsl.mosaic.jooq.tables.Users.USERS;

@Repository
public class UserRepository {

    public Mono<UserEntity> findByEmail(String email, DSLContext dslContext) {
        return Mono.from(
                        dslContext.selectFrom(USERS)
                                .where(USERS.EMAIL.eq(email))
                ).onErrorMap(e -> new CustomException(ResultCode.DB_USER_READ_FAILED, e))
                .map(record -> UserEntity.builder()
                        .pk(record.getPk())
                        .organizationFk(record.getOrganizationFk())
                        .isActive(record.getIsActive())
                        .isOrganizationAdmin(record.getIsOrganizationAdmin())
                        .email(record.getEmail())
                        .fullName(record.getFullName())
                        .createdAt(record.getCreatedAt())
                        .updatedAt(record.getUpdatedAt())
                        .hashedPassword(record.getHashedPassword())
                        .build()
                );
    }

    public Mono<UserEntity> findByPk(java.util.UUID pk, DSLContext dslContext) {
        return Mono.from(
                        dslContext.selectFrom(USERS)
                                .where(USERS.PK.eq(pk))
                ).onErrorMap(e -> new CustomException(ResultCode.DB_USER_READ_FAILED, e))
                .map(record -> UserEntity.builder()
                        .pk(record.getPk())
                        .organizationFk(record.getOrganizationFk())
                        .isActive(record.getIsActive())
                        .isOrganizationAdmin(record.getIsOrganizationAdmin())
                        .email(record.getEmail())
                        .fullName(record.getFullName())
                        .createdAt(record.getCreatedAt())
                        .updatedAt(record.getUpdatedAt())
                        .hashedPassword(record.getHashedPassword())
                        .build()
                );
    }

    public Mono<Integer> updatePassword(java.util.UUID pk, String hashedPassword, DSLContext dslContext) {
        return Mono.from(
                dslContext.update(USERS)
                        .set(USERS.HASHED_PASSWORD, hashedPassword)
                        .set(USERS.UPDATED_AT, java.time.OffsetDateTime.now())
                        .where(USERS.PK.eq(pk))
        ).onErrorMap(e -> new CustomException(ResultCode.DB_USER_UPDATE_FAILED, e));
    }

    public Mono<Integer> updateFullName(java.util.UUID pk, String fullName, DSLContext dslContext) {
        return Mono.from(
                dslContext.update(USERS)
                        .set(USERS.FULL_NAME, fullName)
                        .set(USERS.UPDATED_AT, java.time.OffsetDateTime.now())
                        .where(USERS.PK.eq(pk))
        ).onErrorMap(e -> new CustomException(ResultCode.DB_USER_UPDATE_FAILED, e));
    }

    public Mono<UUID> insertUser(UserEntity user, DSLContext dslContext) {
        return Mono.from(dslContext.insertInto(USERS)
                        .set(USERS.PK, user.getPk())
                        .set(USERS.ORGANIZATION_FK, user.getOrganizationFk())
                        .set(USERS.IS_ACTIVE, user.getIsActive())
                        .set(USERS.IS_ORGANIZATION_ADMIN, user.getIsOrganizationAdmin())
                        .set(USERS.EMAIL, user.getEmail())
                        .set(USERS.FULL_NAME, user.getFullName())
                        .set(USERS.HASHED_PASSWORD, user.getHashedPassword())
                        .set(USERS.CREATED_AT, user.getCreatedAt())
                        .set(USERS.UPDATED_AT, user.getUpdatedAt())
                        .returning(USERS.PK))
                .onErrorMap(e -> new CustomException(ResultCode.DB_USER_CREATE_FAILED, e))
                .map(record -> record.get(USERS.PK));
    }

    public Mono<Integer> countByOrganizationFk(UUID organizationFk, DSLContext dslContext) {
        return Mono.from(
                        dslContext.selectCount()
                                .from(USERS)
                                .where(USERS.ORGANIZATION_FK.eq(organizationFk))
                ).onErrorMap(e -> new CustomException(ResultCode.DB_USER_READ_FAILED, e))
                .map(record -> record.value1());
    }

    public Flux<UserEntity> findAllByOrganizationFk(UUID organizationFk, int skip, int limit, DSLContext dslContext) {
        return Flux.from(
                        dslContext.selectFrom(USERS)
                                .where(USERS.ORGANIZATION_FK.eq(organizationFk))
                                .orderBy(USERS.CREATED_AT.desc())
                                .offset(skip)
                                .limit(limit)
                ).onErrorMap(e -> new CustomException(ResultCode.DB_USER_READ_FAILED, e))
                .map(record -> UserEntity.builder()
                        .pk(record.getPk())
                        .organizationFk(record.getOrganizationFk())
                        .isActive(record.getIsActive())
                        .isOrganizationAdmin(record.getIsOrganizationAdmin())
                        .email(record.getEmail())
                        .fullName(record.getFullName())
                        .createdAt(record.getCreatedAt())
                        .updatedAt(record.getUpdatedAt())
                        .hashedPassword(record.getHashedPassword())
                        .build()
                );
    }

    public Mono<Integer> updateUser(
            UUID pk,
            UUID organizationFk,
            String hashedPassword,
            Boolean isActive,
            Boolean isOrganizationAdmin,
            String fullName,
            DSLContext dslContext
    ) {
        var query = dslContext.update(USERS)
                .set(USERS.UPDATED_AT, java.time.OffsetDateTime.now());

        if (hashedPassword != null) {
            query = query.set(USERS.HASHED_PASSWORD, hashedPassword);
        }
        if (isActive != null) {
            query = query.set(USERS.IS_ACTIVE, isActive);
        }
        if (isOrganizationAdmin != null) {
            query = query.set(USERS.IS_ORGANIZATION_ADMIN, isOrganizationAdmin);
        }
        if (fullName != null) {
            query = query.set(USERS.FULL_NAME, fullName);
        }

        return Mono.from(
                query.where(USERS.PK.eq(pk).and(USERS.ORGANIZATION_FK.eq(organizationFk)))
        ).onErrorMap(e -> new CustomException(ResultCode.DB_USER_UPDATE_FAILED, e));
    }

    public Mono<Integer> deleteByPk(UUID pk, DSLContext dslContext) {
        return Mono.from(
                dslContext.deleteFrom(USERS)
                        .where(USERS.PK.eq(pk))
        ).onErrorMap(e -> new CustomException(ResultCode.DB_USER_DELETE_FAILED, e));
    }
}