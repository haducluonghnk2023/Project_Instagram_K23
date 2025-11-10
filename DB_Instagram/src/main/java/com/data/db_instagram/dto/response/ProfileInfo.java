package com.data.db_instagram.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProfileInfo {
    private UUID id;
    private String fullName;
    private String avatarUrl;
    private String bio;
    private Date birthday;
    private String gender;
    private String location;
    private String privacySettings;
    private Date createdAt;
    private Date updatedAt;
}

