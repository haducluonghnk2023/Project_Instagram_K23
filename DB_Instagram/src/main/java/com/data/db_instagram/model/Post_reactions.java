package com.data.db_instagram.model;

import jakarta.persistence.*;
import lombok.Data;

import java.util.Date;
import java.util.UUID;

@Data
@Entity
@Table(name = "post_reactions")
public class Post_reactions {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(name = "post_id", nullable = false)
    private UUID postId;
    
    @Column(name = "user_id", nullable = false)
    private UUID userId;
    
    @Column(name = "emoji", length = 32)
    private String emoji;
    
    @Column(name = "created_at")
    private Date createdAt = new Date();
    
    @ManyToOne
    @JoinColumn(name = "post_id", insertable = false, updatable = false)
    private Posts post;
    
    @ManyToOne
    @JoinColumn(name = "user_id", insertable = false, updatable = false)
    private Users user;
}
