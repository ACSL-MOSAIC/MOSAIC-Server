package com.gistacsl.mosaic.websocket.session;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.CopyOnWriteArraySet;
import java.util.concurrent.LinkedBlockingQueue;

import io.undertow.websockets.core.WebSocketChannel;
import lombok.Getter;
import reactor.core.publisher.Sinks;

import com.gistacsl.mosaic.security.authentication.UserAuth;
import com.gistacsl.mosaic.websocket.dto.WsMessage;

import org.springframework.core.io.buffer.DataBufferFactory;
import org.springframework.web.reactive.socket.HandshakeInfo;
import org.springframework.web.reactive.socket.adapter.UndertowWebSocketSession;

@Getter
public class UserWsSession extends UndertowWebSocketSession {
  private final UUID sessionId;
  private final Sinks.Many<String> sinks;
  private final LinkedBlockingQueue<WsMessage<?>> pendingMessages;
  private final OffsetDateTime connectedAt;
  private final Set<UUID> subscribedRobotIds = new CopyOnWriteArraySet<>();
  private UserAuth userAuth;
  private Boolean isAuthenticated;

  public UserWsSession(
      UUID sessionId,
      WebSocketChannel channel,
      HandshakeInfo handshakeInfo,
      DataBufferFactory bufferFactory) {
    super(channel, handshakeInfo, bufferFactory);
    this.isAuthenticated = false;
    this.sessionId = sessionId;
    this.sinks = Sinks.many().unicast().onBackpressureBuffer(new LinkedBlockingQueue<>());
    this.pendingMessages = new LinkedBlockingQueue<>();
    this.connectedAt = OffsetDateTime.now();
  }

  public void authenticated(UserAuth userAuth) {
    this.userAuth = userAuth;
    this.isAuthenticated = true;
  }

  public void subscribeToRobots(List<UUID> robotIds) {
    this.subscribedRobotIds.clear();
    this.subscribedRobotIds.addAll(robotIds);
  }

  public void unsubscribeFromRobots(List<UUID> robotIds) {
    this.subscribedRobotIds.removeAll(robotIds);
  }

  public boolean isSubscribedToRobot(UUID robotId) {
    return this.subscribedRobotIds.contains(robotId);
  }

  @Override
  public boolean equals(Object obj) {
    if (!(obj instanceof UserWsSession)) {
      return false;
    }
    return this.sessionId.equals(((UserWsSession) obj).getSessionId());
  }

  public void enqueuePendingMessage(WsMessage<?> message) {
    this.pendingMessages.offer(message);
  }

  public List<WsMessage<?>> drainPendingMessages() {
    List<WsMessage<?>> drained = new ArrayList<>();
    this.pendingMessages.drainTo(drained);
    return drained;
  }

  public void sendMessage(String message) {
    this.sinks.tryEmitNext(message);
  }
}
