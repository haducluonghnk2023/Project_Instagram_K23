package com.data.db_instagram.controller;

import com.data.db_instagram.dto.response.PostResponse;
import com.data.db_instagram.dto.response.ResponseWrapper;
import com.data.db_instagram.security.principal.MyUserDetails;
import com.data.db_instagram.services.SavedPostsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/posts/saved")
@RequiredArgsConstructor
public class SavedPostsController {
    private final SavedPostsService savedPostsService;

    @PostMapping("/{postId}")
    public ResponseEntity<?> savePost(
            @PathVariable UUID postId,
            @AuthenticationPrincipal MyUserDetails userDetails
    ) {
        UUID userId = userDetails.getId();
        savedPostsService.savePost(userId, postId);
        return ResponseEntity.ok(
                ResponseWrapper.builder()
                        .status(HttpStatus.OK)
                        .code(HttpStatus.OK.value())
                        .data("Post saved successfully")
                        .build());
    }

    @DeleteMapping("/{postId}")
    public ResponseEntity<?> unsavePost(
            @PathVariable UUID postId,
            @AuthenticationPrincipal MyUserDetails userDetails
    ) {
        UUID userId = userDetails.getId();
        savedPostsService.unsavePost(userId, postId);
        return ResponseEntity.ok(
                ResponseWrapper.builder()
                        .status(HttpStatus.OK)
                        .code(HttpStatus.OK.value())
                        .data("Post unsaved successfully")
                        .build());
    }

    @GetMapping("/{postId}/check")
    public ResponseEntity<?> checkSaved(
            @PathVariable UUID postId,
            @AuthenticationPrincipal MyUserDetails userDetails
    ) {
        UUID userId = userDetails.getId();
        boolean isSaved = savedPostsService.isPostSaved(userId, postId);
        return ResponseEntity.ok(
                ResponseWrapper.builder()
                        .status(HttpStatus.OK)
                        .code(HttpStatus.OK.value())
                        .data(isSaved)
                        .build());
    }

    @GetMapping
    public ResponseEntity<?> getSavedPosts(
            @AuthenticationPrincipal MyUserDetails userDetails
    ) {
        UUID userId = userDetails.getId();
        List<PostResponse> savedPosts = savedPostsService.getSavedPosts(userId);
        return ResponseEntity.ok(
                ResponseWrapper.builder()
                        .status(HttpStatus.OK)
                        .code(HttpStatus.OK.value())
                        .data(savedPosts)
                        .build());
    }
}

