package com.data.db_instagram.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;
import java.util.UUID;

@Data
@Entity
@Table(name = "comments")
public class Comments {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(name = "post_id", nullable = false)
    private UUID postId;
    
    @Column(name = "user_id", nullable = false)
    private UUID userId;
    
    @Column(name = "parent_comment")
    private UUID parentComment;
    
    @Column(name = "content", columnDefinition = "TEXT")
    private String content;
    
    @Column(name = "image_url", columnDefinition = "TEXT")
    private String imageUrl;
    
    @Column(name = "created_at")
    private Date createdAt = new Date();
    
    @Column(name = "updated_at")
    private Date updatedAt;
    
    @Column(name = "is_deleted")
    private Boolean isDeleted = false;
    
    @ManyToOne
    @JoinColumn(name = "post_id", insertable = false, updatable = false)
    private Posts post;
    
    @ManyToOne
    @JoinColumn(name = "user_id", insertable = false, updatable = false)
    private Users user;
    
    @ManyToOne
    @JoinColumn(name = "parent_comment", insertable = false, updatable = false)
    private Comments parentCommentEntity;
}
