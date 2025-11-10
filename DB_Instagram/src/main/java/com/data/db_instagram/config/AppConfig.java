package com.data.db_instagram.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

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
    
    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
    
    @Bean
    public ObjectMapper objectMapper() {
        return new ObjectMapper();
    }
}

