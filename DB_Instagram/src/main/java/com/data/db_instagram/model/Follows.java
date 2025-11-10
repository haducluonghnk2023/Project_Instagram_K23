package com.data.db_instagram.model;

import jakarta.persistence.*;
import lombok.Data;

import java.util.Date;
import java.util.UUID;

@Data
@Entity
@Table(name = "follows")
public class Follows {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID user_id; // follower

    @Column(name = "target_user_id", nullable = false)
    private UUID target_user_id; // following

    @Column(name = "created_at")
    private Date created_at = new Date();

    @ManyToOne
    @JoinColumn(name = "user_id", insertable = false, updatable = false)
    private Users user;

    @ManyToOne
    @JoinColumn(name = "target_user_id", insertable = false, updatable = false)
    private Users targetUser;
}


