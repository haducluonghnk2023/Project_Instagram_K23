package com.data.db_instagram.model;

import jakarta.persistence.*;
import lombok.Data;

import java.util.Date;
import java.util.UUID;

@Data
@Entity
@Table(name = "messages")
public class Messages {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(name = "from_user", nullable = false)
    private UUID from_user;
    
    @Column(name = "to_user", nullable = false)
    private UUID to_user;
    
    @Column(name = "content", columnDefinition = "TEXT")
    private String content;
    
    @Column(name = "is_read")
    private Boolean is_read = false;
    
    @Column(name = "created_at")
    private Date created_at = new Date();
    
    @Column(name = "updated_at")
    private Date updated_at;
    
    @ManyToOne
    @JoinColumn(name = "from_user", insertable = false, updatable = false)
    private Users fromUser;
    
    @ManyToOne
    @JoinColumn(name = "to_user", insertable = false, updatable = false)
    private Users toUser;
}
