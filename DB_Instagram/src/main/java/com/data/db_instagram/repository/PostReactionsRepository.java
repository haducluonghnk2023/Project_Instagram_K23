package com.data.db_instagram.repository;

import com.data.db_instagram.model.Post_reactions;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PostReactionsRepository extends JpaRepository<Post_reactions, UUID> {
    Optional<Post_reactions> findByPostIdAndUserId(UUID postId, UUID userId);
    List<Post_reactions> findByPostIdOrderByCreatedAtDesc(UUID postId);
    // Batch load reactions for multiple posts - optimized for performance
    List<Post_reactions> findByPostIdInOrderByPostIdAscCreatedAtDesc(List<UUID> postIds);
    long countByPostId(UUID postId);
    boolean existsByPostIdAndUserId(UUID postId, UUID userId);
    void deleteByPostIdAndUserId(UUID postId, UUID userId);
}

