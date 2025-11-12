package com.data.db_instagram.services.impl;

import com.data.db_instagram.dto.request.LoginRequest;
import com.data.db_instagram.dto.request.RegisterRequest;
import com.data.db_instagram.dto.response.AuthResponse;
import com.data.db_instagram.dto.response.ProfileInfo;
import com.data.db_instagram.dto.response.UserInfo;
import com.data.db_instagram.exception.HttpConflict;
import com.data.db_instagram.exception.HttpUnauthorized;
import com.data.db_instagram.model.Auth_tokens;
import com.data.db_instagram.model.Profiles;
import com.data.db_instagram.model.Users;
import com.data.db_instagram.repository.AuthTokensRepository;
import com.data.db_instagram.repository.ProfilesRepository;
import com.data.db_instagram.repository.IUserRepository;
import com.data.db_instagram.security.jwt.JwtProvider;
import com.data.db_instagram.services.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Calendar;
import java.util.Date;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {
    private final IUserRepository userRepository;
    private final ProfilesRepository profilesRepository;
    private final AuthTokensRepository authTokensRepository;
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

        // Lưu refresh token vào DB
        saveRefreshToken(user.getId(), refreshToken, null);

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

        // Lưu refresh token vào DB
        saveRefreshToken(user.getId(), refreshToken, null);

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

    @Override
    @Transactional
    public AuthResponse refreshToken(String refreshToken) {
        // Kiểm tra token có hợp lệ không
        if (!jwtProvider.validateToken(refreshToken)) {
            throw new HttpUnauthorized("Refresh token không hợp lệ hoặc đã hết hạn");
        }

        // Kiểm tra xem token có phải là refresh token không
        if (!jwtProvider.isRefreshToken(refreshToken)) {
            throw new HttpUnauthorized("Token không phải là refresh token");
        }

        // Kiểm tra token trong DB
        Auth_tokens authToken = authTokensRepository.findByToken(refreshToken)
                .orElseThrow(() -> new HttpUnauthorized("Refresh token không tồn tại trong hệ thống"));

        // Kiểm tra token đã bị revoke chưa
        if (authToken.getRevoked()) {
            throw new HttpUnauthorized("Refresh token đã bị thu hồi");
        }

        // Kiểm tra token đã hết hạn chưa
        if (authToken.getExpires_at().before(new Date())) {
            throw new HttpUnauthorized("Refresh token đã hết hạn");
        }

        // Lấy thông tin user
        UUID userId = authToken.getUser_id();
        Users user = userRepository.findById(userId)
                .orElseThrow(() -> new HttpUnauthorized("User không tồn tại"));

        if (!user.getIs_active()) {
            throw new HttpUnauthorized("Tài khoản đã bị vô hiệu hóa");
        }

        // Tạo access token và refresh token mới
        String newAccessToken = jwtProvider.generateToken(user.getEmail(), user.getId());
        String newRefreshToken = jwtProvider.generateRefreshToken(user.getEmail(), user.getId());

        // Revoke token cũ
        authTokensRepository.revokeToken(refreshToken);

        // Lưu refresh token mới vào DB
        saveRefreshToken(userId, newRefreshToken, authToken.getDevice_info());

        // Lấy profile info
        Profiles profile = profilesRepository.findByUserId(user.getId()).orElse(null);
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
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken)
                .user(userInfo)
                .build();
    }

    @Override
    @Transactional
    public void logout(String refreshToken) {
        // Revoke refresh token
        authTokensRepository.revokeToken(refreshToken);
    }

    @Override
    @Transactional
    public void logoutAll(UUID userId) {
        // Revoke tất cả token của user
        authTokensRepository.revokeAllUserTokens(userId);
    }

    /**
     * Lưu refresh token vào database
     */
    private void saveRefreshToken(UUID userId, String refreshToken, String deviceInfo) {
        try {
            // Tính toán thời gian hết hạn dựa trên JWT expiration
            Date expiresAt = jwtProvider.extractExpiration(refreshToken);

            Auth_tokens authToken = new Auth_tokens();
            authToken.setUser_id(userId);
            authToken.setToken(refreshToken);
            authToken.setDevice_info(deviceInfo);
            authToken.setExpires_at(expiresAt);
            authToken.setRevoked(false);
            authToken.setCreated_at(new Date());

            authTokensRepository.save(authToken);
        } catch (Exception e) {
            // Log error nhưng không throw exception để không làm gián đoạn flow đăng nhập
            System.err.println("Error saving refresh token: " + e.getMessage());
        }
    }
}

