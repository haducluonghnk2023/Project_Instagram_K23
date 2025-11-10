package com.data.db_instagram.model;

import jakarta.persistence.*;
import lombok.Data;

import java.util.Date;
import java.util.UUID;

@Data
@Entity
@Table(name = "notifications")
public class Notifications {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(name = "user_id", nullable = false)
    private UUID user_id;
    
    @Column(name = "actor_id")
    private UUID actor_id; // người gây ra (sender)
    
    @Column(name = "type", length = 64)
    private String type; // message_new, friend_request, friend_accept, post_reaction, comment, etc.
    
    @Column(name = "payload", columnDefinition = "JSON")
    private String payload; // chi tiết tùy loại
    
    @Column(name = "is_read")
    private Boolean is_read = false;
    
    @Column(name = "created_at")
    private Date created_at = new Date();
    
    @ManyToOne
    @JoinColumn(name = "user_id", insertable = false, updatable = false)
    private Users user;
    
    @ManyToOne
    @JoinColumn(name = "actor_id", insertable = false, updatable = false)
    private Users actor;
}
