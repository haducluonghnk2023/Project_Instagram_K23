package com.data.db_instagram.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationResponse {
    private UUID id;
    private UUID userId;
    private UUID actorId;
    private String type; // message_new, friend_request, friend_accept, etc.
    private String payload; // JSON string with additional data
    private Boolean isRead;
    private Date createdAt;
    
    // Actor info (người gây ra notification)
    private UserInfo actor;
}

