package com.data.db_instagram.services;

import com.data.db_instagram.dto.request.UpdateProfileRequest;
import com.data.db_instagram.dto.response.UserInfo;

import java.util.UUID;

public interface UserService {
    UserInfo getCurrentUser(UUID userId);
    UserInfo getUserById(UUID userId);
    UserInfo updateProfile(UUID userId, UpdateProfileRequest request);
}
