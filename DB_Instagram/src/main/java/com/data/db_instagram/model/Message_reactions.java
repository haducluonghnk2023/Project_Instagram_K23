package com.data.db_instagram.model;

import jakarta.persistence.*;
import lombok.Data;

import java.util.Date;
import java.util.UUID;

@Data
@Entity
@Table(name = "message_reactions")
public class Message_reactions {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(name = "message_id", nullable = false)
    private UUID message_id;
    
    @Column(name = "user_id", nullable = false)
    private UUID user_id;
    
    @Column(name = "emoji", length = 32)
    private String emoji;
    
    @Column(name = "created_at")
    private Date created_at = new Date();
    
    @ManyToOne
    @JoinColumn(name = "message_id", insertable = false, updatable = false)
    private Messages message;
    
    @ManyToOne
    @JoinColumn(name = "user_id", insertable = false, updatable = false)
    private Users user;
}
