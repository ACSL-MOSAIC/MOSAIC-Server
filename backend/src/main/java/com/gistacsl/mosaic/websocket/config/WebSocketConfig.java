package com.gistacsl.mosaic.websocket.config;

import com.gistacsl.mosaic.websocket.handler.MosaicUserWsHandler;
import com.gistacsl.mosaic.websocket.session.WsSessionManager;
import com.gistacsl.mosaic.websocket.handler.MosaicRobotWsHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.HandlerMapping;
import org.springframework.web.reactive.handler.SimpleUrlHandlerMapping;
import org.springframework.web.reactive.socket.WebSocketHandler;
import org.springframework.web.reactive.socket.server.WebSocketService;
import org.springframework.web.reactive.socket.server.support.HandshakeWebSocketService;
import org.springframework.web.reactive.socket.server.support.WebSocketHandlerAdapter;

import java.util.HashMap;
import java.util.Map;

@Configuration
@RequiredArgsConstructor
public class WebSocketConfig {

    private final WsSessionManager wsSessionManager;

    private final MosaicRobotWsHandler mosaicRobotWsHandler;
    private final MosaicUserWsHandler mosaicUserWsHandler;

    @Bean
    public HandlerMapping handlerMapping() {
        Map<String, WebSocketHandler> map = new HashMap<>();
        map.put("/ws/robot", this.mosaicRobotWsHandler);
        map.put("/ws/user", this.mosaicUserWsHandler);
        return new SimpleUrlHandlerMapping(map, 1);
    }

    @Bean
    public WebSocketHandlerAdapter handlerAdapter() {
        return new WebSocketHandlerAdapter(webSocketService());
    }

    @Bean
    public WebSocketService webSocketService() {
        return new HandshakeWebSocketService(new CustomRequestUpgradeStrategy(this.wsSessionManager));
    }

}
