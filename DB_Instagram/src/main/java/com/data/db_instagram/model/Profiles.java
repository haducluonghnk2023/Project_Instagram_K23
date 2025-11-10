package com.data.db_instagram.model;

import jakarta.persistence.*;
import lombok.Data;

import java.util.Date;
import java.util.UUID;

@Data
@Entity
@Table(name = "profiles")
public class Profiles {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(name = "user_id", unique = true, nullable = false)
    private UUID user_id;
    
    @Column(name = "full_name", length = 255)
    private String full_name;
    
    @Column(name = "avatar_url", columnDefinition = "TEXT")
    private String avatar_url;
    
    @Column(name = "bio", columnDefinition = "TEXT")
    private String bio;
    
    @Column(name = "birthday")
    private Date birthday;
    
    @Column(name = "gender", length = 16)
    private String gender;
    
    @Column(name = "location", length = 255)
    private String location;
    
    @Column(name = "privacy_settings", columnDefinition = "JSON")
    private String privacy_settings;
    
    @Column(name = "created_at")
    private Date created_at = new Date();
    
    @Column(name = "updated_at")
    private Date updated_at;
    
    @OneToOne
    @JoinColumn(name = "user_id", insertable = false, updatable = false)
    private Users user;
}
