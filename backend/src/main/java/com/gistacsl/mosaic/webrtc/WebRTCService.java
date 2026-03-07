package com.gistacsl.mosaic.webrtc;

import java.util.List;
import java.util.UUID;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import com.gistacsl.mosaic.common.enumerate.ResultCode;
import com.gistacsl.mosaic.common.exception.CustomException;
import com.gistacsl.mosaic.repository.IceServerRepository;
import com.gistacsl.mosaic.repository.RobotRepository;
import com.gistacsl.mosaic.repository.entity.RobotEntity;
import com.gistacsl.mosaic.robot.enumerate.RobotStatus;
import com.gistacsl.mosaic.security.authentication.UserAuth;
import com.gistacsl.mosaic.webrtc.dto.IceServerDto;
import com.gistacsl.mosaic.webrtc.dto.WebRTCConnectionDto;
import com.gistacsl.mosaic.websocket.session.WsSessionManager;

import org.jooq.DSLContext;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class WebRTCService {
  private final DSLContext dslContext;
  private final WebRTCSessionManager webRTCSessionManager;
  private final WsSessionManager wsSessionManager;
  private final IceServerRepository iceServerRepository;
  private final RobotRepository robotRepository;

  public Mono<WebRTCConnectionDto.Res> createConnection(
      UserAuth userAuth, WebRTCConnectionDto.Req req) {
    log.info(
        "Creating WebRTC connection for user {} with robots {}",
        userAuth.getUserPk(),
        req.robotIds());

    // Fetch all robots from DB in a single query
    return robotRepository
        .findByPkIn(req.robotIds(), dslContext)
        .collectList()
        .flatMap(robots -> validateRobots(robots, req.robotIds(), userAuth))
        .flatMap(robots -> createWebRTCSession(robots, userAuth));
  }

  private Mono<List<RobotEntity>> validateRobots(
      List<RobotEntity> robots, List<UUID> requestedRobotIds, UserAuth userAuth) {
    // Check if all requested robots were found
    if (robots.size() != requestedRobotIds.size()) {
      return Mono.error(new CustomException(ResultCode.ROBOT_NOT_FOUND));
    }

    // Check if all robots belong to the same organization as the user
    boolean allSameOrganization =
        robots.stream()
            .allMatch(robot -> robot.getOrganizationFk().equals(userAuth.getOrganizationPk()));

    if (!allSameOrganization) {
      return Mono.error(new CustomException(ResultCode.ROBOT_NOT_IN_SAME_ORGANIZATION));
    }

    // Check if all robots are in READY_TO_CONNECT status
    boolean allReady =
        robots.stream().allMatch(robot -> robot.getStatus() == RobotStatus.READY_TO_CONNECT);

    if (!allReady) {
      return Mono.error(new CustomException(ResultCode.ROBOT_NOT_READY_TO_CONNECT));
    }

    return Mono.just(robots);
  }

  private Mono<WebRTCConnectionDto.Res> createWebRTCSession(
      List<RobotEntity> robots, UserAuth userAuth) {
    // Get user WebSocket session
    return Mono.justOrEmpty(wsSessionManager.getUserSessionByUserPk(userAuth.getUserPk()))
        .switchIfEmpty(Mono.error(new CustomException(ResultCode.USER_WS_SESSION_NOT_EXIST)))
        .flatMap(
            userWsSession ->
                Flux.fromIterable(robots)
                    .flatMap(
                        robot ->
                            Mono.fromCallable(
                                () -> {
                                  WebRTCSession session =
                                      webRTCSessionManager.createNewSession(
                                          userWsSession.getSessionId(), robot.getPk());

                                  log.info(
                                      "Created WebRTC session"
                                          + " {} for user {}"
                                          + " and robot {}",
                                      session.getSessionId(),
                                      userAuth.getUserPk(),
                                      robot.getPk());

                                  return new WebRTCConnectionDto.RobotSession(
                                      robot.getPk(), session.getSessionId(), robot.getStatus());
                                }))
                    .collectList()
                    .map(WebRTCConnectionDto.Res::new));
  }

  public Flux<IceServerDto.Res> getIceServers() {
    return iceServerRepository
        .findAll(dslContext)
        .map(
            entity ->
                new IceServerDto.Res(
                    entity.getUrls(), entity.getUsername(), entity.getCredential()));
  }
}
