package com.gistacsl.mosaic.websocket.session;

import com.gistacsl.mosaic.security.authentication.UserAuth;
import io.undertow.websockets.core.WebSocketChannel;
import lombok.Getter;
import lombok.Setter;
import org.springframework.core.io.buffer.DataBufferFactory;
import org.springframework.web.reactive.socket.HandshakeInfo;
import org.springframework.web.reactive.socket.adapter.UndertowWebSocketSession;
import reactor.core.publisher.Sinks;

import java.util.UUID;
import java.util.concurrent.LinkedBlockingQueue;

@Getter
public class UserWsSession extends UndertowWebSocketSession {
    private final UUID sessionId;
    private final Sinks.Many<String> sinks;
    @Setter
    private UserAuth userAuth;
    @Setter
    private Boolean isAuthenticated;

    public UserWsSession(UUID sessionId, WebSocketChannel channel, HandshakeInfo handshakeInfo, DataBufferFactory bufferFactory) {
        super(channel, handshakeInfo, bufferFactory);
        this.isAuthenticated = true; // TODO
        this.sessionId = sessionId;
        this.sinks = Sinks.many().unicast().onBackpressureBuffer(new LinkedBlockingQueue<>());
    }

}
