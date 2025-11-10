package com.data.db_instagram.config;

import com.data.db_instagram.handler.MessageWebSocketHandler;
import com.data.db_instagram.interceptor.WebSocketAuthInterceptor;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketConfigurer {
    
    private final MessageWebSocketHandler messageWebSocketHandler;
    private final WebSocketAuthInterceptor webSocketAuthInterceptor;

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        // Native WebSocket endpoint (for React Native)
        registry.addHandler(messageWebSocketHandler, "/ws/messages")
                .setAllowedOrigins("*") // In production, specify exact origins
                .addInterceptors(webSocketAuthInterceptor);
        
        // SockJS endpoint (for web browsers)
        registry.addHandler(messageWebSocketHandler, "/ws/messages/sockjs")
                .setAllowedOrigins("*")
                .addInterceptors(webSocketAuthInterceptor)
                .withSockJS();
    }
}

