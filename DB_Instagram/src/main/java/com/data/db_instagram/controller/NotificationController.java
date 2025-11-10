package com.data.db_instagram.controller;

import com.data.db_instagram.dto.response.NotificationResponse;
import com.data.db_instagram.dto.response.ResponseWrapper;
import com.data.db_instagram.security.principal.MyUserDetails;
import com.data.db_instagram.services.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {
    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<?> getNotifications(
            @AuthenticationPrincipal MyUserDetails userDetails
    ) {
        UUID userId = userDetails.getId();
        List<NotificationResponse> notifications = notificationService.getNotifications(userId);
        return ResponseEntity.ok(
                ResponseWrapper.builder()
                        .status(HttpStatus.OK)
                        .code(HttpStatus.OK.value())
                        .data(notifications)
                        .build());
    }

    @GetMapping("/unread-count")
    public ResponseEntity<?> getUnreadCount(
            @AuthenticationPrincipal MyUserDetails userDetails
    ) {
        UUID userId = userDetails.getId();
        long count = notificationService.getUnreadCount(userId);
        return ResponseEntity.ok(
                ResponseWrapper.builder()
                        .status(HttpStatus.OK)
                        .code(HttpStatus.OK.value())
                        .data(count)
                        .build());
    }

    @PutMapping("/{notificationId}/read")
    public ResponseEntity<?> markAsRead(
            @PathVariable UUID notificationId,
            @AuthenticationPrincipal MyUserDetails userDetails
    ) {
        UUID userId = userDetails.getId();
        notificationService.markAsRead(notificationId, userId);
        return ResponseEntity.ok(
                ResponseWrapper.builder()
                        .status(HttpStatus.OK)
                        .code(HttpStatus.OK.value())
                        .data("Notification marked as read")
                        .build());
    }

    @PutMapping("/read-all")
    public ResponseEntity<?> markAllAsRead(
            @AuthenticationPrincipal MyUserDetails userDetails
    ) {
        UUID userId = userDetails.getId();
        notificationService.markAllAsRead(userId);
        return ResponseEntity.ok(
                ResponseWrapper.builder()
                        .status(HttpStatus.OK)
                        .code(HttpStatus.OK.value())
                        .data("All notifications marked as read")
                        .build());
    }

    @DeleteMapping("/{notificationId}")
    public ResponseEntity<?> deleteNotification(
            @PathVariable UUID notificationId,
            @AuthenticationPrincipal MyUserDetails userDetails
    ) {
        UUID userId = userDetails.getId();
        notificationService.deleteNotification(notificationId, userId);
        return ResponseEntity.ok(
                ResponseWrapper.builder()
                        .status(HttpStatus.OK)
                        .code(HttpStatus.OK.value())
                        .data("Notification deleted")
                        .build());
    }
}

