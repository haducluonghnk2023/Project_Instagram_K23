package com.data.db_instagram.services.impl;

import com.data.db_instagram.dto.response.PostResponse;
import com.data.db_instagram.exception.HttpBadRequest;
import com.data.db_instagram.exception.HttpNotFound;
import com.data.db_instagram.model.Posts;
import com.data.db_instagram.model.Saved_posts;
import com.data.db_instagram.repository.PostsRepository;
import com.data.db_instagram.repository.SavedPostsRepository;
import com.data.db_instagram.services.PostService;
import com.data.db_instagram.services.SavedPostsService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SavedPostsServiceImpl implements SavedPostsService {
    private final SavedPostsRepository savedPostsRepository;
    private final PostsRepository postsRepository;
    private final PostService postService;

    @Override
    @Transactional
    public void savePost(UUID userId, UUID postId) {
        // Check if post exists
        Posts post = postsRepository.findByIdAndIsDeletedFalse(postId)
                .orElseThrow(() -> new HttpNotFound("Post not found"));

        // Check if already saved
        if (savedPostsRepository.existsByUser_idAndPost_id(userId, postId)) {
            throw new HttpBadRequest("Post already saved");
        }

        Saved_posts savedPost = new Saved_posts();
        savedPost.setUser_id(userId);
        savedPost.setPost_id(postId);
        savedPost.setCreated_at(new Date());
        savedPostsRepository.save(savedPost);
    }

    @Override
    @Transactional
    public void unsavePost(UUID userId, UUID postId) {
        Saved_posts savedPost = savedPostsRepository.findByUser_idAndPost_id(userId, postId)
                .orElseThrow(() -> new HttpNotFound("Post not found in saved posts"));
        savedPostsRepository.delete(savedPost);
    }

    @Override
    public boolean isPostSaved(UUID userId, UUID postId) {
        return savedPostsRepository.existsByUser_idAndPost_id(userId, postId);
    }

    @Override
    public List<PostResponse> getSavedPosts(UUID userId) {
        List<Saved_posts> savedPosts = savedPostsRepository.findByUser_idOrderByCreated_atDesc(userId);
        return savedPosts.stream()
                .map(savedPost -> postService.getPostById(savedPost.getPost_id(), userId))
                .collect(Collectors.toList());
    }
    
    @Override
    public Set<UUID> getSavedPostIds(UUID userId, List<UUID> postIds) {
        if (postIds == null || postIds.isEmpty()) {
            return Collections.emptySet();
        }
        List<UUID> savedIds = savedPostsRepository.findSavedPostIdsByUserAndPostIds(userId, postIds);
        return new HashSet<>(savedIds);
    }
}

