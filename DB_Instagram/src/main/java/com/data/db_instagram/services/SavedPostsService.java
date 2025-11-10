package com.data.db_instagram.services;

import com.data.db_instagram.dto.response.PostResponse;

import java.util.List;
import java.util.UUID;

import java.util.Set;

public interface SavedPostsService {
    void savePost(UUID userId, UUID postId);
    void unsavePost(UUID userId, UUID postId);
    boolean isPostSaved(UUID userId, UUID postId);
    List<PostResponse> getSavedPosts(UUID userId);
    // Batch check saved posts để tránh N+1 query
    Set<UUID> getSavedPostIds(UUID userId, List<UUID> postIds);
}

