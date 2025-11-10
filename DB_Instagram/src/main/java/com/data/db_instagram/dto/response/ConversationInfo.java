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
public class ConversationInfo {
    private UUID userId;
    private UserInfo user;
    private MessageResponse lastMessage;
    private long unreadCount;
    private Date lastMessageAt;
}

