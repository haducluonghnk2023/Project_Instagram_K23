package com.data.db_instagram.model;

import jakarta.persistence.*;
import lombok.Data;

import java.util.Date;
import java.util.UUID;

@Data
@Entity
@Table(name = "blocks")
public class Blocks {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(name = "blocker", nullable = false)
    private UUID blocker;
    
    @Column(name = "blocked", nullable = false)
    private UUID blocked;
    
    @Column(name = "created_at")
    private Date created_at = new Date();
    
    @ManyToOne
    @JoinColumn(name = "blocker", insertable = false, updatable = false)
    private Users blockerUser;
    
    @ManyToOne
    @JoinColumn(name = "blocked", insertable = false, updatable = false)
    private Users blockedUser;
}
