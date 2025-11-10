package com.data.db_instagram.handler;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
@Slf4j
@RequiredArgsConstructor
public class MessageWebSocketHandler extends TextWebSocketHandler {
    
    private final Map<String, WebSocketSession> userSessions = new ConcurrentHashMap<>();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        String userId = (String) session.getAttributes().get("userId");
        if (userId != null) {
            userSessions.put(userId, session);
            log.info("User {} connected. Total connections: {}", userId, userSessions.size());
        } else {
            log.warn("Connection established without userId");
            session.close(CloseStatus.BAD_DATA);
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        String userId = (String) session.getAttributes().get("userId");
        if (userId != null) {
            userSessions.remove(userId);
            log.info("User {} disconnected. Total connections: {}", userId, userSessions.size());
        }
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        // Handle incoming messages from client (if needed)
        // For now, we only send messages from server to client
        log.debug("Received message from client: {}", message.getPayload());
    }

    /**
     * Send message to a specific user
     */
    public void sendMessageToUser(String userId, Object message) {
        WebSocketSession session = userSessions.get(userId);
        if (session != null && session.isOpen()) {
            try {
                String jsonMessage = objectMapper.writeValueAsString(message);
                session.sendMessage(new TextMessage(jsonMessage));
                log.debug("Message sent to user {}: {}", userId, jsonMessage);
            } catch (Exception e) {
                log.error("Error sending message to user {}: {}", userId, e.getMessage());
            }
        } else {
            log.debug("User {} is not connected or session is closed", userId);
        }
    }

    /**
     * Broadcast message to multiple users
     */
    public void sendMessageToUsers(String[] userIds, Object message) {
        for (String userId : userIds) {
            sendMessageToUser(userId, message);
        }
    }

    /**
     * Check if user is connected
     */
    public boolean isUserConnected(String userId) {
        WebSocketSession session = userSessions.get(userId);
        return session != null && session.isOpen();
    }

    /**
     * Get number of connected users
     */
    public int getConnectedUsersCount() {
        return userSessions.size();
    }
}

