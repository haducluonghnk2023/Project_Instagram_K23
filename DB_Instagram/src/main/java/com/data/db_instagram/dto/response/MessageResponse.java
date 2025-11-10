package com.data.db_instagram.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MessageResponse {
    private UUID id;
    private UUID fromUserId;
    private UUID toUserId;
    private String content;
    private Boolean isRead;
    private Date createdAt;
    private Date updatedAt;
    
    // User info
    private UserInfo fromUser;
    private UserInfo toUser;
    
    // Media
    private List<MessageMediaInfo> media;
    
    // Reactions
    private List<MessageReactionInfo> reactions;
    private boolean hasReacted; // Current user has reacted
}

