package com.gistacsl.mosaic.websocket.session;

import io.undertow.websockets.core.WebSocketChannel;
import lombok.Getter;
import lombok.Setter;
import org.springframework.core.io.buffer.DataBufferFactory;
import org.springframework.web.reactive.socket.HandshakeInfo;
import org.springframework.web.reactive.socket.adapter.UndertowWebSocketSession;
import reactor.core.publisher.Sinks;

import java.time.OffsetDateTime;
import java.util.UUID;
import java.util.concurrent.LinkedBlockingQueue;

@Getter
public class RobotWsSession extends UndertowWebSocketSession {
    private final UUID sessionId;
    private final Sinks.Many<String> sinks;
    private final OffsetDateTime connectedAt;
    private UUID robotPk;
    private UUID organizationFk;
    private OffsetDateTime authenticatedAt;
    private Boolean isAuthenticated;

    public RobotWsSession(UUID sessionId, WebSocketChannel channel, HandshakeInfo handshakeInfo, DataBufferFactory bufferFactory) {
        super(channel, handshakeInfo, bufferFactory);
        this.isAuthenticated = false;
        this.sessionId = sessionId;
        this.sinks = Sinks.many().unicast().onBackpressureBuffer(new LinkedBlockingQueue<>());
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

    public void sendMessage(String message) {
        this.sinks.tryEmitNext(message);
    }

}
