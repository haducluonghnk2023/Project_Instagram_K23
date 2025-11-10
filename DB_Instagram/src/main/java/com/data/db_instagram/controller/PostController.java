package com.data.db_instagram.controller;

import com.data.db_instagram.dto.request.CreatePostRequest;
import com.data.db_instagram.dto.request.UpdatePostRequest;
import com.data.db_instagram.dto.response.PostResponse;
import com.data.db_instagram.dto.response.ResponseWrapper;
import com.data.db_instagram.security.principal.MyUserDetails;
import com.data.db_instagram.services.PostService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/posts")
@RequiredArgsConstructor
public class PostController {
    private final PostService postService;

    @PostMapping
    public ResponseEntity<?> createPost(
            @Valid @RequestBody CreatePostRequest request,
            @AuthenticationPrincipal MyUserDetails userDetails
    ) {
        UUID userId = userDetails.getId();
        PostResponse response = postService.createPost(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ResponseWrapper.builder()
                        .status(HttpStatus.CREATED)
                        .code(HttpStatus.CREATED.value())
                        .data(response)
                        .build());
    }

    @PutMapping("/{postId}")
    public ResponseEntity<?> updatePost(
            @PathVariable UUID postId,
            @Valid @RequestBody UpdatePostRequest request,
            @AuthenticationPrincipal MyUserDetails userDetails
    ) {
        UUID userId = userDetails.getId();
        PostResponse response = postService.updatePost(userId, postId, request);
        return ResponseEntity.ok(
                ResponseWrapper.builder()
                        .status(HttpStatus.OK)
                        .code(HttpStatus.OK.value())
                        .data(response)
                        .build());
    }

    @DeleteMapping("/{postId}")
    public ResponseEntity<?> deletePost(
            @PathVariable UUID postId,
            @AuthenticationPrincipal MyUserDetails userDetails
    ) {
        UUID userId = userDetails.getId();
        postService.deletePost(userId, postId);
        return ResponseEntity.ok(
                ResponseWrapper.builder()
                        .status(HttpStatus.OK)
                        .code(HttpStatus.OK.value())
                        .data("Post deleted successfully")
                        .build());
    }

    @GetMapping("/{postId}")
    public ResponseEntity<?> getPostById(
            @PathVariable UUID postId,
            @AuthenticationPrincipal MyUserDetails userDetails
    ) {
        UUID userId = userDetails.getId();
        PostResponse response = postService.getPostById(postId, userId);
        return ResponseEntity.ok(
                ResponseWrapper.builder()
                        .status(HttpStatus.OK)
                        .code(HttpStatus.OK.value())
                        .data(response)
                        .build());
    }

    @GetMapping("/feed")
    public ResponseEntity<?> getFriendsPosts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal MyUserDetails userDetails
    ) {
        UUID userId = userDetails.getId();
        List<PostResponse> posts = postService.getFriendsPosts(userId, page, size);
        return ResponseEntity.ok(
                ResponseWrapper.builder()
                        .status(HttpStatus.OK)
                        .code(HttpStatus.OK.value())
                        .data(posts)
                        .build());
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getUserPosts(
            @PathVariable UUID userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal MyUserDetails userDetails
    ) {
        UUID currentUserId = userDetails.getId();
        List<PostResponse> posts = postService.getUserPosts(userId, currentUserId, page, size);
        return ResponseEntity.ok(
                ResponseWrapper.builder()
                        .status(HttpStatus.OK)
                        .code(HttpStatus.OK.value())
                        .data(posts)
                        .build());
    }

    @GetMapping("/reels")
    public ResponseEntity<?> getReels(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal MyUserDetails userDetails
    ) {
        UUID userId = userDetails.getId();
        List<PostResponse> reels = postService.getReels(userId, page, size);
        return ResponseEntity.ok(
                ResponseWrapper.builder()
                        .status(HttpStatus.OK)
                        .code(HttpStatus.OK.value())
                        .data(reels)
                        .build());
    }
}

