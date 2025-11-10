package com.data.db_instagram.model;

import jakarta.persistence.*;
import lombok.Data;

import java.util.Date;
import java.util.UUID;

@Data
@Entity
@Table(name = "posts")
public class Posts {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(name = "user_id", nullable = false)
    private UUID userId;
    
    @Column(name = "content", columnDefinition = "TEXT")
    private String content;
    
    @Column(name = "visibility", length = 16)
    private String visibility = "public";
    
    @Column(name = "location", length = 255)
    private String location;
    
    @Column(name = "created_at")
    private Date createdAt = new Date();
    
    @Column(name = "updated_at")
    private Date updatedAt;
    
    @Column(name = "is_deleted")
    private Boolean isDeleted = false;
    
    @ManyToOne
    @JoinColumn(name = "user_id", insertable = false, updatable = false)
    private Users user;
}
