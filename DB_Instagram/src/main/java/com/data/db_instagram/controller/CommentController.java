package com.data.db_instagram.controller;

import com.data.db_instagram.dto.request.CreateCommentRequest;
import com.data.db_instagram.dto.response.CommentResponse;
import com.data.db_instagram.dto.response.ResponseWrapper;
import com.data.db_instagram.security.principal.MyUserDetails;
import com.data.db_instagram.services.CommentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/posts/{postId}/comments")
@RequiredArgsConstructor
public class CommentController {
    private final CommentService commentService;

    @PostMapping
    public ResponseEntity<?> createComment(
            @PathVariable UUID postId,
            @Valid @RequestBody CreateCommentRequest request,
            @AuthenticationPrincipal MyUserDetails userDetails
    ) {
        UUID userId = userDetails.getId();
        CommentResponse response = commentService.createComment(userId, postId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ResponseWrapper.builder()
                        .status(HttpStatus.CREATED)
                        .code(HttpStatus.CREATED.value())
                        .data(response)
                        .build());
    }

    @GetMapping
    public ResponseEntity<?> getPostComments(
            @PathVariable UUID postId,
            @AuthenticationPrincipal MyUserDetails userDetails
    ) {
        UUID userId = userDetails.getId();
        List<CommentResponse> comments = commentService.getPostComments(postId, userId);
        return ResponseEntity.ok(
                ResponseWrapper.builder()
                        .status(HttpStatus.OK)
                        .code(HttpStatus.OK.value())
                        .data(comments)
                        .build());
    }

    @DeleteMapping("/{commentId}")
    public ResponseEntity<?> deleteComment(
            @PathVariable UUID postId,
            @PathVariable UUID commentId,
            @AuthenticationPrincipal MyUserDetails userDetails
    ) {
        UUID userId = userDetails.getId();
        commentService.deleteComment(userId, commentId);
        return ResponseEntity.ok(
                ResponseWrapper.builder()
                        .status(HttpStatus.OK)
                        .code(HttpStatus.OK.value())
                        .data("Comment deleted successfully")
                        .build());
    }

    @GetMapping("/{commentId}/replies")
    public ResponseEntity<?> getCommentReplies(
            @PathVariable UUID postId,
            @PathVariable UUID commentId,
            @AuthenticationPrincipal MyUserDetails userDetails
    ) {
        UUID userId = userDetails.getId();
        List<CommentResponse> replies = commentService.getCommentReplies(commentId, userId);
        return ResponseEntity.ok(
                ResponseWrapper.builder()
                        .status(HttpStatus.OK)
                        .code(HttpStatus.OK.value())
                        .data(replies)
                        .build());
    }
}

