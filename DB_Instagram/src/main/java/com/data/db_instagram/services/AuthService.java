package com.data.db_instagram.services;

import com.data.db_instagram.dto.request.LoginRequest;
import com.data.db_instagram.dto.request.RegisterRequest;
import com.data.db_instagram.dto.response.AuthResponse;

import java.util.UUID;

public interface AuthService {
    AuthResponse register(RegisterRequest request);
    AuthResponse login(LoginRequest request);
    AuthResponse refreshToken(String refreshToken);
    void logout(String refreshToken);
    void logoutAll(UUID userId);
}
