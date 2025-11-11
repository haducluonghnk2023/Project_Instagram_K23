package com.data.db_instagram.services.impl;

import com.data.db_instagram.exception.HttpNotFound;
import com.data.db_instagram.model.Post_reactions;
import com.data.db_instagram.model.Posts;
import com.data.db_instagram.repository.PostReactionsRepository;
import com.data.db_instagram.repository.PostsRepository;
import com.data.db_instagram.services.NotificationService;
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
    private final NotificationService notificationService;

    @Override
    @Transactional
    public void toggleReaction(UUID userId, UUID postId) {
        // Verify post exists
        Posts post = postsRepository.findByIdAndIsDeletedFalse(postId)
                .orElseThrow(() -> new HttpNotFound("Post not found"));

        // Check if already reacted - handle duplicate records
        var existingReactions = postReactionsRepository.findAllByPostIdAndUserId(postId, userId);
        boolean hasReacted = !existingReactions.isEmpty();
        
        UUID postOwnerId = post.getUserId();
        String payload = "{\"postId\":\"" + postId + "\"}";
        String postIdPattern = "%\"postId\":\"" + postId + "\"%";
        
        if (hasReacted) {
            // Unlike - remove all reactions (handle duplicates)
            postReactionsRepository.deleteByPostIdAndUserId(postId, userId);
            
            // Xóa notification tương ứng (nếu có)
            if (!postOwnerId.equals(userId)) {
                notificationService.deleteNotificationByUserIdAndTypeAndActorIdAndPayload(
                        postOwnerId, userId, "post_reaction", postIdPattern);
            }
        } else {
            // Like - add reaction
            // Clean up any duplicates first (defensive programming)
            postReactionsRepository.deleteByPostIdAndUserId(postId, userId);
            
            Post_reactions reaction = new Post_reactions();
            reaction.setPostId(postId);
            reaction.setUserId(userId);
            reaction.setEmoji("❤️");
            reaction.setCreatedAt(new Date());
            postReactionsRepository.save(reaction);
            
            // Tạo notification cho post owner (chỉ nếu không phải like bài của chính mình)
            if (!postOwnerId.equals(userId)) {
                // Chỉ tạo notification nếu chưa có notification chưa đọc cho post này
                boolean hasUnreadNotification = notificationService.hasUnreadNotification(
                        postOwnerId, userId, "post_reaction", postIdPattern);
                
                if (!hasUnreadNotification) {
                    notificationService.createNotification(postOwnerId, userId, "post_reaction", payload);
                }
            }
        }
    }

    @Override
    public boolean hasReacted(UUID userId, UUID postId) {
        return postReactionsRepository.existsByPostIdAndUserId(postId, userId);
    }
}

