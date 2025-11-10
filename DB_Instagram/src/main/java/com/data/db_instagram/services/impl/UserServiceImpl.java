package com.data.db_instagram.services.impl;

import com.data.db_instagram.dto.request.UpdateProfileRequest;
import com.data.db_instagram.dto.response.ProfileInfo;
import com.data.db_instagram.dto.response.UserInfo;
import com.data.db_instagram.exception.HttpNotFound;
import com.data.db_instagram.model.Profiles;
import com.data.db_instagram.model.Users;
import com.data.db_instagram.repository.ProfilesRepository;
import com.data.db_instagram.repository.IUserRepository;
import com.data.db_instagram.services.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {
    private final IUserRepository userRepository;
    private final ProfilesRepository profilesRepository;

    @Override
    public UserInfo getCurrentUser(UUID userId) {
        Users user = userRepository.findById(userId)
                .orElseThrow(() -> new HttpNotFound("User not found with id: " + userId));

        Profiles profile = profilesRepository.findByUserId(userId)
                .orElse(null);

        ProfileInfo profileInfo = null;
        if (profile != null) {
            profileInfo = ProfileInfo.builder()
                    .id(profile.getId())
                    .fullName(profile.getFull_name())
                    .avatarUrl(profile.getAvatar_url())
                    .bio(profile.getBio())
                    .birthday(profile.getBirthday())
                    .gender(profile.getGender())
                    .location(profile.getLocation())
                    .privacySettings(profile.getPrivacy_settings())
                    .createdAt(profile.getCreated_at())
                    .updatedAt(profile.getUpdated_at())
                    .build();
        }

        return UserInfo.builder()
                .id(user.getId())
                .phone(user.getPhone())
                .email(user.getEmail())
                .profile(profileInfo)
                .build();
    }

    @Override
    public UserInfo getUserById(UUID userId) {
        Users user = userRepository.findById(userId)
                .orElseThrow(() -> new HttpNotFound("User not found with id: " + userId));

        Profiles profile = profilesRepository.findByUserId(userId)
                .orElse(null);

        ProfileInfo profileInfo = null;
        if (profile != null) {
            profileInfo = ProfileInfo.builder()
                    .id(profile.getId())
                    .fullName(profile.getFull_name())
                    .avatarUrl(profile.getAvatar_url())
                    .bio(profile.getBio())
                    .birthday(profile.getBirthday())
                    .gender(profile.getGender())
                    .location(profile.getLocation())
                    .privacySettings(profile.getPrivacy_settings())
                    .createdAt(profile.getCreated_at())
                    .updatedAt(profile.getUpdated_at())
                    .build();
        }

        return UserInfo.builder()
                .id(user.getId())
                .phone(user.getPhone())
                .email(user.getEmail())
                .profile(profileInfo)
                .build();
    }

    @Override
    @Transactional
    public UserInfo updateProfile(UUID userId, UpdateProfileRequest request) {
        Users user = userRepository.findById(userId)
                .orElseThrow(() -> new HttpNotFound("User not found with id: " + userId));

        Profiles profile = profilesRepository.findByUserId(userId)
                .orElse(null);

        if (profile == null) {
            // Create profile if it doesn't exist
            profile = new Profiles();
            profile.setUser_id(userId);
            profile.setCreated_at(new Date());
        }

        // Update profile fields
        if (request.getFullName() != null) {
            profile.setFull_name(request.getFullName());
        }
        if (request.getAvatarUrl() != null) {
            profile.setAvatar_url(request.getAvatarUrl());
        }
        if (request.getBio() != null) {
            profile.setBio(request.getBio());
        }
        if (request.getBirthday() != null) {
            profile.setBirthday(request.getBirthday());
        }
        if (request.getGender() != null) {
            profile.setGender(request.getGender());
        }
        if (request.getLocation() != null) {
            profile.setLocation(request.getLocation());
        }
        if (request.getPrivacySettings() != null) {
            profile.setPrivacy_settings(request.getPrivacySettings());
        }

        profile.setUpdated_at(new Date());
        profile = profilesRepository.save(profile);

        // Build response
        ProfileInfo profileInfo = ProfileInfo.builder()
                .id(profile.getId())
                .fullName(profile.getFull_name())
                .avatarUrl(profile.getAvatar_url())
                .bio(profile.getBio())
                .birthday(profile.getBirthday())
                .gender(profile.getGender())
                .location(profile.getLocation())
                .privacySettings(profile.getPrivacy_settings())
                .createdAt(profile.getCreated_at())
                .updatedAt(profile.getUpdated_at())
                .build();

        return UserInfo.builder()
                .id(user.getId())
                .phone(user.getPhone())
                .email(user.getEmail())
                .profile(profileInfo)
                .build();
    }
}

