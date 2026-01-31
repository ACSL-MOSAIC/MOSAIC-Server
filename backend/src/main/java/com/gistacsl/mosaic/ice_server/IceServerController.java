package com.gistacsl.mosaic.ice_server;

import com.gistacsl.mosaic.ice_server.dto.IceServerDto;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Flux;

@RestController
@RequestMapping("/api/v1/ice-servers")
@RequiredArgsConstructor
public class IceServerController {
    private final IceServerService iceServerService;

    @GetMapping
    public Flux<IceServerDto.Res> getIceServers() {
        return iceServerService.getIceServers();
    }
}