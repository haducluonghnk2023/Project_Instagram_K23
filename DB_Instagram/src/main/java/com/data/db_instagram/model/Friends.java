package com.data.db_instagram.model;

import jakarta.persistence.*;
import lombok.Data;

import java.util.Date;
import java.util.UUID;

@Data
@Entity
@Table(name = "friends")
public class Friends {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(name = "user_a", nullable = false)
    private UUID user_a;
    
    @Column(name = "user_b", nullable = false)
    private UUID user_b;
    
    @Column(name = "since")
    private Date since = new Date();
    
    @ManyToOne
    @JoinColumn(name = "user_a", insertable = false, updatable = false)
    private Users userA;
    
    @ManyToOne
    @JoinColumn(name = "user_b", insertable = false, updatable = false)
    private Users userB;
}
