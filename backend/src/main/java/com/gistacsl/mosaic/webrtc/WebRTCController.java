package com.gistacsl.mosaic.webrtc;

import java.util.List;

import lombok.RequiredArgsConstructor;
import reactor.core.publisher.Mono;

import com.gistacsl.mosaic.common.GResponse;
import com.gistacsl.mosaic.security.authentication.UserAuth;
import com.gistacsl.mosaic.webrtc.dto.IceServerDto;
import com.gistacsl.mosaic.webrtc.dto.WebRTCConnectionDto;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/webrtc")
@RequiredArgsConstructor
public class WebRTCController {
  private final WebRTCService webRTCService;

  @PostMapping("/connection")
  public Mono<GResponse<WebRTCConnectionDto.Res>> createConnection(
      @RequestBody WebRTCConnectionDto.Req req) {
    return UserAuth.getUserAuthFromSecurityContextHolder()
        .flatMap(userAuth -> webRTCService.createConnection(userAuth, req))
        .map(GResponse::toGResponse);
  }

  @GetMapping("/ice-servers")
  public Mono<GResponse<List<IceServerDto.Res>>> getIceServers() {
    return webRTCService.getIceServers().collectList().map(GResponse::toGResponse);
  }
}
