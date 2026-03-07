package com.gistacsl.mosaic.websocket.session;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.LinkedBlockingQueue;

import io.undertow.websockets.core.WebSocketChannel;
import lombok.Getter;
import reactor.core.publisher.Sinks;

import com.gistacsl.mosaic.websocket.dto.WsMessage;

import org.springframework.core.io.buffer.DataBufferFactory;
import org.springframework.web.reactive.socket.HandshakeInfo;
import org.springframework.web.reactive.socket.adapter.UndertowWebSocketSession;

@Getter
public class RobotWsSession extends UndertowWebSocketSession {
  private final UUID sessionId;
  private final Sinks.Many<String> sinks;
  private final OffsetDateTime connectedAt;
  private final LinkedBlockingQueue<WsMessage<?>> pendingMessages;
  private UUID robotPk;
  private UUID organizationFk;
  private OffsetDateTime authenticatedAt;
  private Boolean isAuthenticated;

  public RobotWsSession(
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
    this.authenticatedAt = OffsetDateTime.now();
  }

  public void authenticated(UUID robotPk, UUID organizationFk) {
    this.robotPk = robotPk;
    this.organizationFk = organizationFk;
    this.isAuthenticated = true;
    this.authenticatedAt = OffsetDateTime.now();
  }

  @Override
  public boolean equals(Object obj) {
    if (!(obj instanceof RobotWsSession)) {
      return false;
    }
    return this.sessionId.equals(((RobotWsSession) obj).getSessionId());
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
