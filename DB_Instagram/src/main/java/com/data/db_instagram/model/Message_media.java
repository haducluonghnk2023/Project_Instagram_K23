package com.data.db_instagram.model;

import jakarta.persistence.*;
import lombok.Data;

import java.util.UUID;

@Data
@Entity
@Table(name = "message_media")
public class Message_media {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(name = "message_id", nullable = false)
    private UUID message_id;
    
    @Column(name = "media_url", columnDefinition = "TEXT", nullable = false)
    private String media_url;
    
    @Column(name = "media_type", length = 16)
    private String media_type;
    
    @ManyToOne
    @JoinColumn(name = "message_id", insertable = false, updatable = false)
    private Messages message;
}
