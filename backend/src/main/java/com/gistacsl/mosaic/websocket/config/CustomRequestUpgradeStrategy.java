package com.gistacsl.mosaic.websocket.config;

import com.gistacsl.mosaic.websocket.dto.WsMessage;
import com.gistacsl.mosaic.websocket.handler.WsMessageSender;
import com.gistacsl.mosaic.websocket.session.RobotWsSession;
import com.gistacsl.mosaic.websocket.session.UserWsSession;
import com.gistacsl.mosaic.websocket.session.WsSessionManager;
import io.undertow.server.HttpServerExchange;
import io.undertow.websockets.WebSocketConnectionCallback;
import io.undertow.websockets.WebSocketProtocolHandshakeHandler;
import io.undertow.websockets.core.WebSocketChannel;
import io.undertow.websockets.core.protocol.Handshake;
import io.undertow.websockets.core.protocol.version13.Hybi13Handshake;
import io.undertow.websockets.spi.WebSocketHttpExchange;
import org.springframework.core.io.buffer.DataBufferFactory;
import org.springframework.http.server.reactive.ServerHttpRequestDecorator;
import org.springframework.web.reactive.socket.HandshakeInfo;
import org.springframework.web.reactive.socket.WebSocketHandler;
import org.springframework.web.reactive.socket.adapter.ContextWebSocketHandler;
import org.springframework.web.reactive.socket.adapter.UndertowWebSocketHandlerAdapter;
import org.springframework.web.reactive.socket.server.RequestUpgradeStrategy;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.function.Supplier;

public class CustomRequestUpgradeStrategy implements RequestUpgradeStrategy {

    private final WsSessionManager wsSessionManager;
    private final WsMessageSender wsMessageSender;

    public CustomRequestUpgradeStrategy(WsSessionManager wsSessionManager, WsMessageSender wsMessageSender) {
        this.wsSessionManager = wsSessionManager;
        this.wsMessageSender = wsMessageSender;
    }

    @Override
    public Mono<Void> upgrade(ServerWebExchange exchange, WebSocketHandler webSocketHandler, String subProtocol, Supplier<HandshakeInfo> handshakeInfoFactory) {
        // Exactly Same with UndertowRequestUpgradeStrategy
        HttpServerExchange httpExchange = ServerHttpRequestDecorator.getNativeRequest(exchange.getRequest());
        Set<String> protocols = subProtocol != null ? Collections.singleton(subProtocol) : Collections.emptySet();
        Hybi13Handshake handshake = new Hybi13Handshake(protocols, false);
        List<Handshake> handshakes = Collections.singletonList(handshake);
        HandshakeInfo handshakeInfo = handshakeInfoFactory.get();
        DataBufferFactory bufferFactory = exchange.getResponse().bufferFactory();
        return exchange.getResponse().setComplete().then(Mono.deferContextual((contextView) -> {
            WebSocketConnectionCallback callback;
            if (httpExchange.getRequestURI().startsWith("/ws/robot")) {
                callback = new CustomRobotWSConnectionCallBack(this.wsSessionManager, this.wsMessageSender, handshakeInfo, ContextWebSocketHandler.decorate(webSocketHandler, contextView), bufferFactory);
            } else {
                callback = new CustomUserWSConnectionCallBack(this.wsSessionManager, handshakeInfo, ContextWebSocketHandler.decorate(webSocketHandler, contextView), bufferFactory);
            }

            try {
                (new WebSocketProtocolHandshakeHandler(handshakes, callback)).handleRequest(httpExchange);
            } catch (Exception var8) {
                Exception ex = var8;
                return Mono.error(ex);
            }

            return Mono.empty();
        }));
    }

    private static class CustomRobotWSConnectionCallBack implements WebSocketConnectionCallback {
        private final WsSessionManager wsSessionManager;
        private final WsMessageSender wsMessageSender;

        private final HandshakeInfo handshakeInfo;
        private final WebSocketHandler handler;
        private final DataBufferFactory bufferFactory;

        CustomRobotWSConnectionCallBack(WsSessionManager wsSessionManager, WsMessageSender wsMessageSender, HandshakeInfo handshakeInfo, WebSocketHandler handler, DataBufferFactory bufferFactory) {
            this.wsSessionManager = wsSessionManager;
            this.wsMessageSender = wsMessageSender;

            this.handshakeInfo = handshakeInfo;
            this.handler = handler;
            this.bufferFactory = bufferFactory;
        }

        @Override
        public void onConnect(WebSocketHttpExchange webSocketHttpExchange, WebSocketChannel webSocketChannel) {
            UUID sessionId = UUID.randomUUID();
            RobotWsSession session = new RobotWsSession(sessionId, webSocketChannel, this.handshakeInfo, this.bufferFactory);

            wsSessionManager.addRobotSession(sessionId, session);

            UndertowWebSocketHandlerAdapter adapter = new UndertowWebSocketHandlerAdapter(session);
            webSocketChannel.getReceiveSetter().set(adapter);
            webSocketChannel.resumeReceives();
            this.handler.handle(session).checkpoint(webSocketHttpExchange.getRequestURI() + " [UndertowRequestUpgradeStrategy]").subscribe(session);
        }

        private void requestAuthorization(RobotWsSession session) {
            WsMessage<Void> wsMessage = new WsMessage<>("authorize.req", null);
            try {
                this.wsMessageSender.sendWsMessageToRobot(wsMessage, session);
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    }

    private static class CustomUserWSConnectionCallBack implements WebSocketConnectionCallback {
        private final WsSessionManager wsSessionManager;

        private final HandshakeInfo handshakeInfo;
        private final WebSocketHandler handler;
        private final DataBufferFactory bufferFactory;

        CustomUserWSConnectionCallBack(WsSessionManager wsSessionManager, HandshakeInfo handshakeInfo, WebSocketHandler handler, DataBufferFactory bufferFactory) {
            this.wsSessionManager = wsSessionManager;

            this.handshakeInfo = handshakeInfo;
            this.handler = handler;
            this.bufferFactory = bufferFactory;
        }

        @Override
        public void onConnect(WebSocketHttpExchange webSocketHttpExchange, WebSocketChannel webSocketChannel) {
            UUID sessionId = UUID.randomUUID();
            UserWsSession session = new UserWsSession(sessionId, webSocketChannel, this.handshakeInfo, this.bufferFactory);

            wsSessionManager.addUserSession(sessionId, session);

            UndertowWebSocketHandlerAdapter adapter = new UndertowWebSocketHandlerAdapter(session);
            webSocketChannel.getReceiveSetter().set(adapter);
            webSocketChannel.resumeReceives();

            this.requestAuthorization(session);
            
            this.handler.handle(session).checkpoint(webSocketHttpExchange.getRequestURI() + " [UndertowRequestUpgradeStrategy]").subscribe(session);
        }
    }
}