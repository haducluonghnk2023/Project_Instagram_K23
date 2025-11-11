package com.data.db_instagram.repository;

import com.data.db_instagram.model.Comment_tags;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CommentTagsRepository extends JpaRepository<Comment_tags, UUID> {
    List<Comment_tags> findByComment_id(UUID commentId);
    
    void deleteByComment_id(UUID commentId);
}

