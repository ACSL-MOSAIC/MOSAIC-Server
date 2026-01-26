package com.gistacsl.mosaic.robot;

import com.gistacsl.mosaic.common.dto.MessageDto;
import com.gistacsl.mosaic.common.enumerate.ResultCode;
import com.gistacsl.mosaic.common.exception.CustomException;
import com.gistacsl.mosaic.repository.RobotRepository;
import com.gistacsl.mosaic.repository.entity.RobotEntity;
import com.gistacsl.mosaic.robot.dto.RobotAddDto;
import com.gistacsl.mosaic.robot.dto.RobotInfo;
import com.gistacsl.mosaic.robot.dto.RobotInfosPage;
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

    public Mono<RobotInfosPage> listRobots(UserAuth userAuth, int skip, int limit) {
        return robotRepository.countByOrganizationFk(userAuth.getOrganizationPk(), dslContext)
                .flatMap(count -> robotRepository.findAllByOrganizationFk(userAuth.getOrganizationPk(), skip, limit, dslContext)
                        .map(this::robotEntitytoRobotInfo)
                        .collectList()
                        .map(robots -> new RobotInfosPage(robots, count)));
    }

    public Mono<MessageDto> addRobot(UserAuth userAuth, RobotAddDto robotAddDto) {
        return Mono.from(dslContext.transactionPublisher(configuration -> {
            DSLContext txContext = configuration.dsl();

            RobotEntity newRobot = RobotEntity.builder()
                    .pk(UUID.randomUUID())
                    .organizationFk(userAuth.getOrganizationPk())
                    .name(robotAddDto.name())
                    .description(robotAddDto.description())
                    .status(robotAddDto.status() != null ? robotAddDto.status() : RobotStatus.DISCONNECTED)
                    .build();

            return robotRepository.insertRobot(newRobot, txContext);
        })).map(pk -> new MessageDto("Robot added successfully"));
    }

    public Mono<RobotInfo> getRobot(UserAuth userAuth, UUID robotId) {
        return robotRepository.findByPkAndOrganizationFk(robotId, userAuth.getOrganizationPk(), dslContext)
                .switchIfEmpty(Mono.error(new CustomException(ResultCode.ROBOT_NOT_FOUND)))
                .map(this::robotEntitytoRobotInfo);
    }

    public Mono<MessageDto> updateRobot(UserAuth userAuth, UUID robotId, RobotUpdateDto updateDto) {
        return Mono.from(dslContext.transactionPublisher(configuration -> {
            DSLContext txContext = configuration.dsl();

            return robotRepository.findByPkAndOrganizationFk(robotId, userAuth.getOrganizationPk(), txContext)
                    .switchIfEmpty(Mono.error(new CustomException(ResultCode.ROBOT_NOT_FOUND)))
                    .flatMap(existingRobot -> robotRepository.updateRobot(
                            robotId,
                            userAuth.getOrganizationPk(),
                            updateDto.name(),
                            updateDto.description(),
                            updateDto.status(),
                            txContext));
        })).map(pk -> new MessageDto("Robot updated successfully"));
    }

    public Mono<MessageDto> deleteRobot(UserAuth userAuth, UUID robotId) {
        return Mono.from(dslContext.transactionPublisher(configuration -> {
            DSLContext txContext = configuration.dsl();

            return robotRepository.findByPkAndOrganizationFk(robotId, userAuth.getOrganizationPk(), txContext)
                    .switchIfEmpty(Mono.error(new CustomException(ResultCode.ROBOT_NOT_FOUND)))
                    .flatMap(existingRobot -> robotRepository.deleteByPkAndOrganizationFk(robotId, userAuth.getOrganizationPk(), txContext));
        })).map(rowsAffected -> new MessageDto("Robot deleted successfully"));
    }

    private RobotInfo robotEntitytoRobotInfo(RobotEntity entity) {
        return new RobotInfo(
                entity.getPk(),
                entity.getName(),
                entity.getDescription(),
                entity.getStatus(),
                entity.getOrganizationFk()
        );
    }
}