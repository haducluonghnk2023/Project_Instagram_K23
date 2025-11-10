package com.data.db_instagram.services;

import com.data.db_instagram.dto.response.NotificationResponse;

import java.util.List;
import java.util.UUID;

public interface NotificationService {
    void createNotification(UUID userId, UUID actorId, String type, String payload);
    
    List<NotificationResponse> getNotifications(UUID userId);
    
    long getUnreadCount(UUID userId);
    
    void markAsRead(UUID notificationId, UUID userId);
    
    void markAllAsRead(UUID userId);
    
    void deleteNotification(UUID notificationId, UUID userId);
}

