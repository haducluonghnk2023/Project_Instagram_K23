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
public class PostResponse {
    private UUID id;
    private UUID userId;
    private String content;
    private String visibility;
    private String location;
    private Date createdAt;
    private Date updatedAt;
    
    // User info
    private UserInfo user;
    
    // Media
    private List<PostMediaInfo> media;
    
    // Stats
    private long reactionCount;
    private long commentCount;
    private boolean hasReacted; // Current user has reacted
    private boolean isSaved; // Current user has saved this post
    
    // Reactions preview (first few users)
    private List<ReactionInfo> reactions;
}

