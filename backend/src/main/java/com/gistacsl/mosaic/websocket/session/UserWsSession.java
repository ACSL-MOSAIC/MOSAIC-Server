package com.gistacsl.mosaic.websocket.session;

import com.gistacsl.mosaic.security.authentication.UserAuth;
import com.gistacsl.mosaic.websocket.dto.WsMessage;
import io.undertow.websockets.core.WebSocketChannel;
import lombok.Getter;
import org.springframework.core.io.buffer.DataBufferFactory;
import org.springframework.web.reactive.socket.HandshakeInfo;
import org.springframework.web.reactive.socket.adapter.UndertowWebSocketSession;
import reactor.core.publisher.Sinks;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.LinkedBlockingQueue;

@Getter
public class UserWsSession extends UndertowWebSocketSession {
    private final UUID sessionId;
    private final Sinks.Many<String> sinks;
    private final LinkedBlockingQueue<WsMessage<?>> pendingMessages;
    private final OffsetDateTime connectedAt;
    private UserAuth userAuth;
    private Boolean isAuthenticated;

    public UserWsSession(UUID sessionId, WebSocketChannel channel, HandshakeInfo handshakeInfo, DataBufferFactory bufferFactory) {
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
