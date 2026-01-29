package com.gistacsl.mosaic.repository;

import com.gistacsl.mosaic.common.enumerate.ResultCode;
import com.gistacsl.mosaic.common.exception.CustomException;
import com.gistacsl.mosaic.repository.entity.KeyPairEntity;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Mono;

import java.util.UUID;

import static com.gistacsl.mosaic.jooq.tables.KeyPair.KEY_PAIR;

@Repository
public class KeyPairRepository {

    public Mono<KeyPairEntity> findByPurpose(String purpose, DSLContext dslContext) {
        return Mono.from(
                dslContext.selectFrom(KEY_PAIR)
                        .where(KEY_PAIR.PURPOSE.eq(purpose))
        ).onErrorMap(e -> new CustomException(ResultCode.DB_KEY_PAIR_READ_FAILED, e))
        .map(record -> KeyPairEntity.builder()
                .pk(record.getPk())
                .purpose(record.getPurpose())
                .encryptedPrivateKey(record.getEncryptedPrivateKey())
                .publicKey(record.getPublicKey())
                .algorithm(record.getAlgorithm())
                .keySize(record.getKeySize())
                .createdAt(record.getCreatedAt())
                .updatedAt(record.getUpdatedAt())
                .build()
        );
    }

    public Mono<UUID> insert(KeyPairEntity entity, DSLContext dslContext) {
        return Mono.from(
                dslContext.insertInto(KEY_PAIR)
                        .set(KEY_PAIR.PK, entity.getPk())
                        .set(KEY_PAIR.PURPOSE, entity.getPurpose())
                        .set(KEY_PAIR.ENCRYPTED_PRIVATE_KEY, entity.getEncryptedPrivateKey())
                        .set(KEY_PAIR.PUBLIC_KEY, entity.getPublicKey())
                        .set(KEY_PAIR.ALGORITHM, entity.getAlgorithm())
                        .set(KEY_PAIR.KEY_SIZE, entity.getKeySize())
                        .set(KEY_PAIR.CREATED_AT, entity.getCreatedAt())
                        .set(KEY_PAIR.UPDATED_AT, entity.getUpdatedAt())
                        .returning(KEY_PAIR.PK)
        ).onErrorMap(e -> new CustomException(ResultCode.DB_KEY_PAIR_CREATE_FAILED, e))
        .map(record -> record.get(KEY_PAIR.PK));
    }
}