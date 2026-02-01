package com.gistacsl.mosaic.ice_server;

import com.gistacsl.mosaic.ice_server.dto.IceServerDto;
import com.gistacsl.mosaic.repository.IceServerRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jooq.DSLContext;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;

@Slf4j
@Service
@RequiredArgsConstructor
public class IceServerService {
    private final DSLContext dslContext;
    private final IceServerRepository iceServerRepository;

    public Flux<IceServerDto.Res> getIceServers() {
        return iceServerRepository.findAll(dslContext)
                .map(entity -> new IceServerDto.Res(
                        entity.getUrls(),
                        entity.getUsername(),
                        entity.getCredential()
                ));
    }
}