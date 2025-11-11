package com.data.db_instagram.repository;

import com.data.db_instagram.model.Comments;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CommentsRepository extends JpaRepository<Comments, UUID> {
    List<Comments> findByPostIdAndIsDeletedFalseOrderByCreatedAtDesc(UUID postId);
    List<Comments> findByPostIdAndParentCommentIsNullAndIsDeletedFalseOrderByCreatedAtDesc(UUID postId);
    List<Comments> findByParentCommentAndIsDeletedFalseOrderByCreatedAtAsc(UUID parentCommentId);
    // Tìm tất cả replies (kể cả đã bị deleted) để xóa khi xóa parent comment
    List<Comments> findByParentComment(UUID parentCommentId);
    long countByPostIdAndIsDeletedFalse(UUID postId);
    // Batch load comment counts for multiple posts - optimized for performance
    @Query("SELECT c.postId, COUNT(c) FROM Comments c WHERE c.postId IN :postIds AND c.isDeleted = false GROUP BY c.postId")
    List<Object[]> countByPostIdInAndIsDeletedFalse(@Param("postIds") List<UUID> postIds);
}

