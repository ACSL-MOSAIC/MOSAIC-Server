package com.gistacsl.mosaic.repository;

import com.gistacsl.mosaic.common.enumerate.ResultCode;
import com.gistacsl.mosaic.common.exception.CustomException;
import com.gistacsl.mosaic.repository.entity.IceServerEntity;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;

import static com.gistacsl.mosaic.jooq.tables.IceServer.ICE_SERVER;

@Repository
public class IceServerRepository {

    public Flux<IceServerEntity> findAll(DSLContext dslContext) {
        return Flux.from(
                dslContext.selectFrom(ICE_SERVER)
        ).onErrorMap(e -> new CustomException(ResultCode.DB_ICE_SERVER_READ_FAILED, e))
        .map(record -> IceServerEntity.builder()
                .pk(record.getPk())
                .urls(record.getUrls())
                .username(record.getUsername())
                .credential(record.getCredential())
                .createdAt(record.getCreatedAt())
                .updatedAt(record.getUpdatedAt())
                .build()
        );
    }
}