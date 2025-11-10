package com.data.db_instagram.model;

import jakarta.persistence.*;
import lombok.Data;

import java.util.Date;
import java.util.UUID;

@Data
@Entity
@Table(name = "users")
public class Users {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;
    
    @Column(name = "phone", length = 15, unique = true)
    private String phone;
    
    @Column(name = "email", length = 255, unique = true)
    private String email;
    
    @Column(name = "password_hash", length = 255, nullable = false)
    private String password_hash;
    
    @Column(name = "is_active")
    private Boolean is_active = true;
    
    @Column(name = "created_at")
    private Date created_at = new Date();
    
    @Column(name = "updated_at")
    private Date updated_at;
}
