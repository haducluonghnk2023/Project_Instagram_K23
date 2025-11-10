package com.data.db_instagram.services.impl;

import com.data.db_instagram.dto.request.LoginRequest;
import com.data.db_instagram.dto.request.RegisterRequest;
import com.data.db_instagram.dto.response.AuthResponse;
import com.data.db_instagram.dto.response.ProfileInfo;
import com.data.db_instagram.dto.response.UserInfo;
import com.data.db_instagram.exception.HttpConflict;
import com.data.db_instagram.exception.HttpUnauthorized;
import com.data.db_instagram.model.Profiles;
import com.data.db_instagram.model.Users;
import com.data.db_instagram.repository.ProfilesRepository;
import com.data.db_instagram.repository.IUserRepository;
import com.data.db_instagram.security.jwt.JwtProvider;
import com.data.db_instagram.services.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {
    private final IUserRepository userRepository;
    private final ProfilesRepository profilesRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtProvider jwtProvider;

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new HttpConflict("Email already exists: " + request.getEmail());
        }

        if (userRepository.existsByPhone(request.getPhone())) {
            throw new HttpConflict("Phone already exists: " + request.getPhone());
        }

        Users user = new Users();
        user.setEmail(request.getEmail());
        user.setPhone(request.getPhone());
        user.setPassword_hash(passwordEncoder.encode(request.getPassword()));
        user.setIs_active(true);
        user.setCreated_at(new Date());
        user = userRepository.save(user);

        Profiles profile = new Profiles();
        profile.setUser_id(user.getId());
        profile.setFull_name(request.getFullName());
        profile.setCreated_at(new Date());
        profile = profilesRepository.save(profile);

        String accessToken = jwtProvider.generateToken(user.getEmail(), user.getId());
        String refreshToken = jwtProvider.generateRefreshToken(user.getEmail(), user.getId());

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

        UserInfo userInfo = UserInfo.builder()
                .id(user.getId())
                .phone(user.getPhone())
                .email(user.getEmail())
                .profile(profileInfo)
                .build();

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .user(userInfo)
                .build();
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        Users user = userRepository.findByEmailOrPhone(request.getEmail(), request.getEmail())
                .orElseThrow(() -> new HttpUnauthorized("Email không tồn tại trong hệ thống"));

        if (!user.getIs_active()) {
            throw new HttpUnauthorized("Tài khoản đã bị vô hiệu hóa");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword_hash())) {
            throw new HttpUnauthorized("Sai mật khẩu");
        }

        Profiles profile = profilesRepository.findByUserId(user.getId())
                .orElse(null);

        String accessToken = jwtProvider.generateToken(user.getEmail(), user.getId());
        String refreshToken = jwtProvider.generateRefreshToken(user.getEmail(), user.getId());

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

        UserInfo userInfo = UserInfo.builder()
                .id(user.getId())
                .phone(user.getPhone())
                .email(user.getEmail())
                .profile(profileInfo)
                .build();

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .user(userInfo)
                .build();
    }
}

