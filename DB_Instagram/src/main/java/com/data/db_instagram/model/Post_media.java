package com.data.db_instagram.model;

import jakarta.persistence.*;
import lombok.Data;

import java.util.UUID;

@Data
@Entity
@Table(name = "post_media")
public class Post_media {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(name = "post_id", nullable = false)
    private UUID postId;
    
    @Column(name = "media_url", columnDefinition = "TEXT", nullable = false)
    private String mediaUrl;
    
    @Column(name = "media_type", length = 16)
    private String mediaType;
    
    @Column(name = "order_index")
    private Integer orderIndex = 0;
    
    @ManyToOne
    @JoinColumn(name = "post_id", insertable = false, updatable = false)
    private Posts post;
}
