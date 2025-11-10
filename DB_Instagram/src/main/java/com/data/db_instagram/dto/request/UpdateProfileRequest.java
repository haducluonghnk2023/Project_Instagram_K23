package com.data.db_instagram.dto.request;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateProfileRequest {
    @Size(max = 255, message = "Full name must not exceed 255 characters")
    private String fullName;

    private String avatarUrl;

    @Size(max = 1000, message = "Bio must not exceed 1000 characters")
    private String bio;

    private Date birthday;

    @Size(max = 16, message = "Gender must not exceed 16 characters")
    private String gender;

    @Size(max = 255, message = "Location must not exceed 255 characters")
    private String location;

    private String privacySettings; // JSON string
}

