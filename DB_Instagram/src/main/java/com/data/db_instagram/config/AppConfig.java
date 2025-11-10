package com.data.db_instagram.config;

import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Configuration
@Getter
public class AppConfig {
    
    @Value("${jwt.secret.key}")
    private String jwtSecretKey;
    
    @Value("${jwt.expired.access}")
    private Long jwtExpiredAccess;
    
    @Value("${jwt.expired.refresh:604800}")  // Default 7 days if not specified
    private Long jwtExpiredRefresh;
    
    @Value("${cors.allowed-origins}")
    private String corsAllowedOrigins;
}

