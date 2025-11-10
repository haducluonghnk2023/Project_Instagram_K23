package com.data.db_instagram.model;

import jakarta.persistence.*;
import lombok.Data;

import java.util.Date;
import java.util.UUID;

@Data
@Entity
@Table(name = "auth_tokens")
public class Auth_tokens {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(name = "user_id", nullable = false)
    private UUID user_id;
    
    @Column(name = "token", columnDefinition = "TEXT", nullable = false)
    private String token;
    
    @Column(name = "device_info", columnDefinition = "TEXT")
    private String device_info;
    
    @Column(name = "expires_at", nullable = false)
    private Date expires_at;
    
    @Column(name = "revoked")
    private Boolean revoked = false;
    
    @Column(name = "created_at")
    private Date created_at = new Date();
    
    @ManyToOne
    @JoinColumn(name = "user_id", insertable = false, updatable = false)
    private Users user;
}
