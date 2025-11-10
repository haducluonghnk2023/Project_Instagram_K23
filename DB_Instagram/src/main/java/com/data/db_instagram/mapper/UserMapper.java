package com.data.db_instagram.mapper;

import com.data.db_instagram.dto.response.ProfileInfo;
import com.data.db_instagram.dto.response.UserInfo;
import com.data.db_instagram.model.Profiles;
import com.data.db_instagram.model.Users;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {
    
    public UserInfo toUserInfo(Users user, Profiles profile) {
        if (user == null) {
            return null;
        }
        
        ProfileInfo profileInfo = null;
        if (profile != null) {
            profileInfo = toProfileInfo(profile);
        }
        
        return UserInfo.builder()
            .id(user.getId())
            .phone(user.getPhone())
            .email(user.getEmail())
            .profile(profileInfo)
            .build();
    }
    
    public ProfileInfo toProfileInfo(Profiles profile) {
        if (profile == null) {
            return null;
        }
        
        return ProfileInfo.builder()
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
}

