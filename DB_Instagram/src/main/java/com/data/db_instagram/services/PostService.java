package com.data.db_instagram.services;

import com.data.db_instagram.dto.request.CreatePostRequest;
import com.data.db_instagram.dto.request.UpdatePostRequest;
import com.data.db_instagram.dto.response.PostResponse;

import java.util.List;
import java.util.UUID;

public interface PostService {
    PostResponse createPost(UUID userId, CreatePostRequest request);
    PostResponse updatePost(UUID userId, UUID postId, UpdatePostRequest request);
    void deletePost(UUID userId, UUID postId);
    PostResponse getPostById(UUID postId, UUID currentUserId);
    List<PostResponse> getFriendsPosts(UUID userId, int page, int size);
    List<PostResponse> getUserPosts(UUID userId, UUID currentUserId, int page, int size);
    List<PostResponse> getReels(UUID userId, int page, int size);
}

