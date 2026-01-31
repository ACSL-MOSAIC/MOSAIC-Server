package com.gistacsl.mosaic.robot;

import com.gistacsl.mosaic.common.GResponse;
import com.gistacsl.mosaic.robot.dto.SimpleTokenDto;
import com.gistacsl.mosaic.security.authentication.UserAuth;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/v1/robots/auth")
@RequiredArgsConstructor
public class RobotAuthController {
    private final RobotAuthService robotAuthService;

    @PostMapping("/simple-token")
    public Mono<GResponse<SimpleTokenDto.Res>> generateSimpleToken(@RequestBody SimpleTokenDto.Req req) {
        return UserAuth.getUserAuthFromSecurityContextHolder()
                .flatMap(userAuth -> robotAuthService.generateSimpleToken(userAuth, req.robotId()))
                .map(GResponse::toGResponse);
    }
}