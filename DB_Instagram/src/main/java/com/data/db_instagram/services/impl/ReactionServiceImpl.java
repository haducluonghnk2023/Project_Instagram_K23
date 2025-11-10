package com.data.db_instagram.services.impl;

import com.data.db_instagram.exception.HttpNotFound;
import com.data.db_instagram.model.Post_reactions;
import com.data.db_instagram.model.Posts;
import com.data.db_instagram.repository.PostReactionsRepository;
import com.data.db_instagram.repository.PostsRepository;
import com.data.db_instagram.services.ReactionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ReactionServiceImpl implements ReactionService {
    private final PostReactionsRepository postReactionsRepository;
    private final PostsRepository postsRepository;

    @Override
    @Transactional
    public void toggleReaction(UUID userId, UUID postId) {
        // Verify post exists
        Posts post = postsRepository.findByIdAndIsDeletedFalse(postId)
                .orElseThrow(() -> new HttpNotFound("Post not found"));

        // Check if already reacted
        var existingReaction = postReactionsRepository.findByPostIdAndUserId(postId, userId);
        
        if (existingReaction.isPresent()) {
            // Unlike - remove reaction
            postReactionsRepository.deleteByPostIdAndUserId(postId, userId);
        } else {
            // Like - add reaction
            Post_reactions reaction = new Post_reactions();
            reaction.setPostId(postId);
            reaction.setUserId(userId);
            reaction.setEmoji("❤️");
            reaction.setCreatedAt(new Date());
            postReactionsRepository.save(reaction);
        }
    }

    @Override
    public boolean hasReacted(UUID userId, UUID postId) {
        return postReactionsRepository.existsByPostIdAndUserId(postId, userId);
    }
}

