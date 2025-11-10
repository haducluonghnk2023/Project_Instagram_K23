package com.data.db_instagram.services.impl;

import com.data.db_instagram.dto.response.NotificationResponse;
import com.data.db_instagram.dto.response.UserInfo;
import com.data.db_instagram.mapper.UserMapper;
import com.data.db_instagram.model.Notifications;
import com.data.db_instagram.model.Profiles;
import com.data.db_instagram.model.Users;
import com.data.db_instagram.repository.IUserRepository;
import com.data.db_instagram.repository.NotificationsRepository;
import com.data.db_instagram.repository.ProfilesRepository;
import com.data.db_instagram.services.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {
    private final NotificationsRepository notificationsRepository;
    private final IUserRepository userRepository;
    private final ProfilesRepository profilesRepository;
    private final UserMapper userMapper;

    @Override
    @Transactional
    public void createNotification(UUID userId, UUID actorId, String type, String payload) {
        Notifications notification = new Notifications();
        notification.setUser_id(userId);
        notification.setActor_id(actorId);
        notification.setType(type);
        notification.setPayload(payload);
        notification.setIs_read(false);
        notification.setCreated_at(new Date());
        notificationsRepository.save(notification);
    }

    @Override
    public List<NotificationResponse> getNotifications(UUID userId) {
        List<Notifications> notifications = notificationsRepository.findByUserIdOrderByCreatedAtDesc(userId);
        return notifications.stream()
                .map(this::buildNotificationResponse)
                .collect(Collectors.toList());
    }

    @Override
    public long getUnreadCount(UUID userId) {
        return notificationsRepository.countUnreadNotifications(userId);
    }

    @Override
    @Transactional
    public void markAsRead(UUID notificationId, UUID userId) {
        Notifications notification = notificationsRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found"));
        
        if (!notification.getUser_id().equals(userId)) {
            throw new RuntimeException("You can only mark your own notifications as read");
        }
        
        notification.setIs_read(true);
        notificationsRepository.save(notification);
    }

    @Override
    @Transactional
    public void markAllAsRead(UUID userId) {
        List<Notifications> unreadNotifications = notificationsRepository.findUnreadNotificationsByUserId(userId);
        for (Notifications notification : unreadNotifications) {
            notification.setIs_read(true);
        }
        notificationsRepository.saveAll(unreadNotifications);
    }

    @Override
    @Transactional
    public void deleteNotification(UUID notificationId, UUID userId) {
        Notifications notification = notificationsRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found"));
        
        if (!notification.getUser_id().equals(userId)) {
            throw new RuntimeException("You can only delete your own notifications");
        }
        
        notificationsRepository.delete(notification);
    }

    private NotificationResponse buildNotificationResponse(Notifications notification) {
        Users actor = notification.getActor_id() != null 
                ? userRepository.findById(notification.getActor_id()).orElse(null)
                : null;
        
        Profiles actorProfile = actor != null 
                ? profilesRepository.findByUserId(actor.getId()).orElse(null)
                : null;
        
        UserInfo actorInfo = userMapper.toUserInfo(actor, actorProfile);

        return NotificationResponse.builder()
                .id(notification.getId())
                .userId(notification.getUser_id())
                .actorId(notification.getActor_id())
                .type(notification.getType())
                .payload(notification.getPayload())
                .isRead(notification.getIs_read())
                .createdAt(notification.getCreated_at())
                .actor(actorInfo)
                .build();
    }
}

