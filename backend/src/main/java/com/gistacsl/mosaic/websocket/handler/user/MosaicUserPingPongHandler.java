package com.gistacsl.mosaic.websocket.handler.user;

import java.time.OffsetDateTime;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.gistacsl.mosaic.common.enumerate.ResultCode;
import com.gistacsl.mosaic.common.exception.CustomException;
import com.gistacsl.mosaic.websocket.dto.WsMessage;
import com.gistacsl.mosaic.websocket.handler.WsMessageSender;
import com.gistacsl.mosaic.websocket.handler.dto.PingWsDto;
import com.gistacsl.mosaic.websocket.handler.dto.PongWsDto;
import com.gistacsl.mosaic.websocket.session.UserWsSession;
import com.gistacsl.mosaic.websocket.session.WsSessionManager;

import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class MosaicUserPingPongHandler {
  public static final String TYPE_PREFIX = "ping";
  public static final String TYPE_PING = TYPE_PREFIX + ".ping";
  public static final String TYPE_PONG = TYPE_PREFIX + ".pong";
  private static final long TIMEOUT_SECONDS = 15;

  private final ObjectMapper objectMapper;
  private final WsMessageSender wsMessageSender;
  private final WsSessionManager wsSessionManager;

  private final ConcurrentHashMap<UUID, PingRecord> pendingPings = new ConcurrentHashMap<>();

  public Mono<Void> handleWsMessage(WsMessage<?> wsMessage, UserWsSession wsSession) {
    if (!wsMessage.getType().equals(TYPE_PONG)) {
      return Mono.error(new CustomException(ResultCode.UNKNOWN_WEBSOCKET_REQUEST_TYPE));
    }

    PongWsDto pongDto = this.objectMapper.convertValue(wsMessage.getData(), PongWsDto.class);
    return this.handlePong(pongDto.pingId(), wsSession);
  }

  public void sendPing(UserWsSession session) {
    UUID pingId = UUID.randomUUID();
    PingWsDto pingDto = new PingWsDto(pingId);
    WsMessage<PingWsDto> wsMessage = new WsMessage<>(TYPE_PING, pingDto);

    try {
      this.wsMessageSender.sendWsMessageToUser(wsMessage, session);

      PingRecord record = new PingRecord(session.getSessionId(), pingId, OffsetDateTime.now());
      this.pendingPings.put(session.getSessionId(), record);

      log.debug("Ping sent to user session: {} with pingId: {}", session.getSessionId(), pingId);
    } catch (CustomException e) {
      log.error("Failed to send ping to user session: {}", session.getSessionId(), e);
    }
  }

  public Mono<Void> handlePong(UUID pingId, UserWsSession session) {
    PingRecord record = this.pendingPings.remove(session.getSessionId());

    if (record != null && record.pingId.equals(pingId)) {
      log.debug(
          "Pong received from user session: {} for pingId: {}", session.getSessionId(), pingId);
    } else {
      log.warn(
          "Unexpected pong from user session: {} with pingId: {}", session.getSessionId(), pingId);
    }

    return Mono.empty();
  }

  public void checkAndCloseTimeoutSessions() {
    OffsetDateTime now = OffsetDateTime.now();

    this.pendingPings
        .values()
        .forEach(
            record -> {
              long secondsElapsed = now.toEpochSecond() - record.sentAt.toEpochSecond();

              if (secondsElapsed > TIMEOUT_SECONDS) {
                log.warn(
                    "User session timeout: {} (ping sent at: {}, elapsed: {}s)",
                    record.sessionId,
                    record.sentAt,
                    secondsElapsed);

                this.wsSessionManager
                    .getUserSession(record.sessionId)
                    .ifPresent(
                        session ->
                            session
                                .close()
                                .doOnSuccess(
                                    v -> {
                                      log.info(
                                          "User session"
                                              + " closed"
                                              + " due to"
                                              + " ping"
                                              + " timeout:"
                                              + " {}",
                                          record.sessionId);
                                      this.wsSessionManager.removeUserSession(record.sessionId);
                                    })
                                .doOnError(
                                    e ->
                                        log.error(
                                            "Failed to" + " close" + " user" + " session:" + " {}",
                                            record.sessionId,
                                            e))
                                .subscribe());

                this.pendingPings.remove(record.sessionId);
              }
            });
  }

  private record PingRecord(UUID sessionId, UUID pingId, OffsetDateTime sentAt) {}
}
