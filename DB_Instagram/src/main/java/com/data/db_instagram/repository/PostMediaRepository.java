package com.data.db_instagram.repository;

import com.data.db_instagram.model.Post_media;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PostMediaRepository extends JpaRepository<Post_media, UUID> {
    List<Post_media> findByPostIdOrderByOrderIndexAsc(UUID postId);
    // Batch load media for multiple posts - optimized for performance
    List<Post_media> findByPostIdInOrderByPostIdAscOrderIndexAsc(List<UUID> postIds);
    void deleteByPostId(UUID postId);
}

