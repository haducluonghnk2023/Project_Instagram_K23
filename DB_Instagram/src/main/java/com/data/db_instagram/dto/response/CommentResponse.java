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
public class CommentResponse {
    private UUID id;
    private UUID postId;
    private UUID userId;
    private UUID parentCommentId;
    private String content;
    private String imageUrl;
    private Date createdAt;
    private Date updatedAt;
    
    // User info
    private UserInfo user;
    
    // Replies count
    private long replyCount;
    
    // Reactions count
    private long reactionCount;
    private boolean hasReacted;
    
    // Tagged users
    private List<UUID> taggedUserIds;
}

