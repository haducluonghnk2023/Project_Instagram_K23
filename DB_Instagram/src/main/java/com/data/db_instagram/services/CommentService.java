package com.data.db_instagram.services;

import com.data.db_instagram.dto.request.CreateCommentRequest;
import com.data.db_instagram.dto.response.CommentResponse;

import java.util.List;
import java.util.UUID;

public interface CommentService {
    CommentResponse createComment(UUID userId, UUID postId, CreateCommentRequest request);
    void deleteComment(UUID userId, UUID commentId);
    List<CommentResponse> getPostComments(UUID postId, UUID currentUserId);
    List<CommentResponse> getCommentReplies(UUID commentId, UUID currentUserId);
}

