package com.gistacsl.mosaic.robot;

import com.gistacsl.mosaic.common.enumerate.ResultCode;
import com.gistacsl.mosaic.common.exception.CustomException;
import com.gistacsl.mosaic.repository.RobotRepository;
import com.gistacsl.mosaic.repository.entity.RobotEntity;
import com.gistacsl.mosaic.robot.dto.SimpleTokenDto;
import com.gistacsl.mosaic.robot.enumerate.RobotAuthType;
import com.gistacsl.mosaic.security.authentication.UserAuth;
import com.gistacsl.mosaic.websocket.handler.robot.auth.impl.SimpleTokenHandler;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jooq.DSLContext;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class RobotAuthService {
    private final DSLContext dslContext;
    private final RobotRepository robotRepository;
    private final SimpleTokenHandler simpleTokenHandler;

    public Mono<SimpleTokenDto.Res> generateSimpleToken(UserAuth userAuth, UUID robotPk) {
        return robotRepository.findByPkAndOrganizationFk(robotPk, userAuth.getOrganizationPk(), dslContext)
                .switchIfEmpty(Mono.error(new CustomException(ResultCode.ROBOT_NOT_FOUND)))
                .flatMap(robotEntity -> {
                    // Verify robot uses simple token auth
                    if (robotEntity.getAuthType() != RobotAuthType.SIMPLE_TOKEN) {
                        return Mono.error(new CustomException(ResultCode.INVALID_ROBOT_AUTH_TYPE));
                    }

                    // Generate token
                    String token = simpleTokenHandler.generateToken(robotEntity);
                    return Mono.just(new SimpleTokenDto.Res(token));
                });
    }
}