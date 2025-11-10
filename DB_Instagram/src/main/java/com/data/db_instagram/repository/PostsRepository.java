package com.data.db_instagram.repository;

import com.data.db_instagram.model.Posts;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PostsRepository extends JpaRepository<Posts, UUID> {
    
    // Tìm tất cả posts của user (chưa xóa) - với pagination
    Page<Posts> findByUserIdAndIsDeletedFalseOrderByCreatedAtDesc(UUID userId, Pageable pageable);
    
    // Tìm tất cả posts của user (chưa xóa) - không pagination (cho backward compatibility)
    List<Posts> findByUserIdAndIsDeletedFalseOrderByCreatedAtDesc(UUID userId);
    
    // Tìm post theo ID (chưa xóa)
    Optional<Posts> findByIdAndIsDeletedFalse(UUID id);
    
    // Tìm posts của bạn bè (friends) - với pagination tối ưu
    // Hiển thị: posts của chính user, posts public, hoặc posts của bạn bè (bất kỳ visibility)
    @Query("SELECT DISTINCT p FROM Posts p " +
           "WHERE p.isDeleted = false " +
           "AND (p.userId = :userId " +
           "     OR p.visibility = 'public' " +
           "     OR EXISTS (SELECT 1 FROM Friends f WHERE (f.user_a = :userId AND f.user_b = p.userId) OR (f.user_b = :userId AND f.user_a = p.userId))) " +
           "ORDER BY p.createdAt DESC")
    Page<Posts> findFriendsPosts(@Param("userId") UUID userId, Pageable pageable);
    
    // Tìm posts của bạn bè (friends) - không pagination (cho backward compatibility)
    // Hiển thị: posts của chính user, posts public, hoặc posts của bạn bè (bất kỳ visibility)
    @Query("SELECT DISTINCT p FROM Posts p " +
           "WHERE p.isDeleted = false " +
           "AND (p.userId = :userId " +
           "     OR p.visibility = 'public' " +
           "     OR EXISTS (SELECT 1 FROM Friends f WHERE (f.user_a = :userId AND f.user_b = p.userId) OR (f.user_b = :userId AND f.user_a = p.userId))) " +
           "ORDER BY p.createdAt DESC")
    List<Posts> findFriendsPosts(@Param("userId") UUID userId);
    
    // Tìm tất cả public posts (chưa xóa)
    List<Posts> findByVisibilityAndIsDeletedFalseOrderByCreatedAtDesc(String visibility);
    
    // Đếm số posts của user
    long countByUserIdAndIsDeletedFalse(UUID userId);
    
    // Tìm posts có video (reels) - với pagination tối ưu
    @Query("SELECT DISTINCT p FROM Posts p " +
           "WHERE p.isDeleted = false " +
           "AND EXISTS (SELECT 1 FROM Post_media pm WHERE pm.postId = p.id AND pm.mediaType = 'video') " +
           "AND (p.userId = :userId " +
           "     OR p.visibility = 'public' " +
           "     OR EXISTS (SELECT 1 FROM Friends f WHERE (f.user_a = :userId AND f.user_b = p.userId) OR (f.user_b = :userId AND f.user_a = p.userId))) " +
           "ORDER BY p.createdAt DESC")
    Page<Posts> findReels(@Param("userId") UUID userId, Pageable pageable);
    
    // Tìm posts có video (reels) - không pagination (cho backward compatibility)
    @Query("SELECT DISTINCT p FROM Posts p " +
           "WHERE p.isDeleted = false " +
           "AND EXISTS (SELECT 1 FROM Post_media pm WHERE pm.postId = p.id AND pm.mediaType = 'video') " +
           "AND (p.userId = :userId " +
           "     OR p.visibility = 'public' " +
           "     OR EXISTS (SELECT 1 FROM Friends f WHERE (f.user_a = :userId AND f.user_b = p.userId) OR (f.user_b = :userId AND f.user_a = p.userId))) " +
           "ORDER BY p.createdAt DESC")
    List<Posts> findReels(@Param("userId") UUID userId);
}

