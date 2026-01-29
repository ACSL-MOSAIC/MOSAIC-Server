package com.gistacsl.mosaic.robot;

import com.gistacsl.mosaic.common.dto.MessageDto;
import com.gistacsl.mosaic.common.enumerate.ResultCode;
import com.gistacsl.mosaic.common.exception.CustomException;
import com.gistacsl.mosaic.repository.RobotRepository;
import com.gistacsl.mosaic.repository.entity.RobotEntity;
import com.gistacsl.mosaic.robot.dto.RobotAddDto;
import com.gistacsl.mosaic.robot.dto.RobotInfoDto;
import com.gistacsl.mosaic.robot.dto.RobotListDto;
import com.gistacsl.mosaic.robot.dto.RobotUpdateDto;
import com.gistacsl.mosaic.robot.enumerate.RobotStatus;
import com.gistacsl.mosaic.security.authentication.UserAuth;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jooq.DSLContext;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class RobotService {
    private final DSLContext dslContext;
    private final RobotRepository robotRepository;

    public Mono<RobotListDto.Res> listRobots(UserAuth userAuth, int skip, int limit) {
        return robotRepository.countByOrganizationFk(userAuth.getOrganizationPk(), dslContext)
                .flatMap(count -> robotRepository.findAllByOrganizationFk(userAuth.getOrganizationPk(), skip, limit, dslContext)
                        .map(this::robotEntityToRobotInfoRes)
                        .collectList()
                        .map(robots -> new RobotListDto.Res(robots, count)));
    }

    public Mono<MessageDto> addRobot(UserAuth userAuth, RobotAddDto.Req req) {
        return Mono.from(dslContext.transactionPublisher(configuration -> {
            DSLContext txContext = configuration.dsl();

            RobotEntity newRobot = RobotEntity.builder()
                    .pk(UUID.randomUUID())
                    .organizationFk(userAuth.getOrganizationPk())
                    .name(req.name())
                    .description(req.description())
                    .status(req.status() != null ? req.status() : RobotStatus.DISCONNECTED)
                    .build();

            return robotRepository.insertRobot(newRobot, txContext);
        })).map(pk -> new MessageDto("Robot added successfully"));
    }

    public Mono<RobotInfoDto.Res> getRobot(UserAuth userAuth, UUID robotPk) {
        return robotRepository.findByPkAndOrganizationFk(robotPk, userAuth.getOrganizationPk(), dslContext)
                .switchIfEmpty(Mono.error(new CustomException(ResultCode.ROBOT_NOT_FOUND)))
                .map(this::robotEntityToRobotInfoRes);
    }

    public Mono<MessageDto> updateRobot(UserAuth userAuth, UUID robotPk, RobotUpdateDto.Req req) {
        return Mono.from(dslContext.transactionPublisher(configuration -> {
            DSLContext txContext = configuration.dsl();

            return robotRepository.findByPkAndOrganizationFk(robotPk, userAuth.getOrganizationPk(), txContext)
                    .switchIfEmpty(Mono.error(new CustomException(ResultCode.ROBOT_NOT_FOUND)))
                    .flatMap(existingRobot -> robotRepository.updateRobot(
                            robotPk,
                            userAuth.getOrganizationPk(),
                            req.name(),
                            req.description(),
                            req.status(),
                            txContext));
        })).map(pk -> new MessageDto("Robot updated successfully"));
    }

    public Mono<MessageDto> deleteRobot(UserAuth userAuth, UUID robotPk) {
        return Mono.from(dslContext.transactionPublisher(configuration -> {
            DSLContext txContext = configuration.dsl();

            return robotRepository.findByPkAndOrganizationFk(robotPk, userAuth.getOrganizationPk(), txContext)
                    .switchIfEmpty(Mono.error(new CustomException(ResultCode.ROBOT_NOT_FOUND)))
                    .flatMap(existingRobot -> robotRepository.deleteByPkAndOrganizationFk(robotPk, userAuth.getOrganizationPk(), txContext));
        })).map(rowsAffected -> new MessageDto("Robot deleted successfully"));
    }

    public Mono<Void> updateRobotStatus(RobotStatus status, UUID robotPk, UUID organizationPk) {
        return Mono.from(dslContext.transactionPublisher(configuration -> {
            DSLContext txContext = configuration.dsl();

            return robotRepository.updateRobotStatus(status, robotPk, organizationPk, txContext)
                    .switchIfEmpty(Mono.error(new CustomException(ResultCode.ROBOT_NOT_FOUND)));
        })).then();
    }

    private RobotInfoDto.Res robotEntityToRobotInfoRes(RobotEntity entity) {
        return new RobotInfoDto.Res(
                entity.getPk(),
                entity.getName(),
                entity.getDescription(),
                entity.getStatus(),
                entity.getOrganizationFk()
        );
    }
}