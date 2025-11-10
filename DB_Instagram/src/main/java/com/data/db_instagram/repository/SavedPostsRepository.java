package com.data.db_instagram.repository;

import com.data.db_instagram.model.Saved_posts;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SavedPostsRepository extends JpaRepository<Saved_posts, UUID> {
    @Query("SELECT s FROM Saved_posts s WHERE s.user_id = :userId AND s.post_id = :postId")
    Optional<Saved_posts> findByUser_idAndPost_id(@Param("userId") UUID userId, @Param("postId") UUID postId);
    
    @Query("SELECT CASE WHEN COUNT(s) > 0 THEN true ELSE false END FROM Saved_posts s WHERE s.user_id = :userId AND s.post_id = :postId")
    boolean existsByUser_idAndPost_id(@Param("userId") UUID userId, @Param("postId") UUID postId);
    
    @Query("SELECT s FROM Saved_posts s WHERE s.user_id = :userId ORDER BY s.created_at DESC")
    List<Saved_posts> findByUser_idOrderByCreated_atDesc(@Param("userId") UUID userId);
    
    @Modifying
    @Query("DELETE FROM Saved_posts s WHERE s.user_id = :userId AND s.post_id = :postId")
    void deleteByUser_idAndPost_id(@Param("userId") UUID userId, @Param("postId") UUID postId);
    
    // Batch check saved posts
    @Query("SELECT s.post_id FROM Saved_posts s WHERE s.user_id = :userId AND s.post_id IN :postIds")
    List<UUID> findSavedPostIdsByUserAndPostIds(@Param("userId") UUID userId, @Param("postIds") List<UUID> postIds);
}

