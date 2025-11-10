package com.data.db_instagram.utils;

import com.data.db_instagram.exception.HttpUnauthorized;
import com.data.db_instagram.security.jwt.JwtProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
@RequiredArgsConstructor
public class JwtUtils {
    private final JwtProvider jwtProvider;

    public UUID extractUserIdFromToken(String authorization) {
        if (authorization == null || authorization.isEmpty()) {
            throw new HttpUnauthorized("Authorization header is required");
        }

        String token = authorization.startsWith("Bearer ")
            ? authorization.substring(7).trim() 
            : authorization.trim();

        if (!jwtProvider.validateToken(token)) {
            throw new HttpUnauthorized("Invalid or expired token");
        }

        UUID userId = jwtProvider.extractUserId(token);
        
        if (userId == null) {
            throw new HttpUnauthorized("Invalid token format: userId not found");
        }

        return userId;
    }
}

