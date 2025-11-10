package com.data.db_instagram.services;

import com.data.db_instagram.dto.request.LoginRequest;
import com.data.db_instagram.dto.request.RegisterRequest;
import com.data.db_instagram.dto.response.AuthResponse;
import com.data.db_instagram.exception.HttpConflict;
import com.data.db_instagram.exception.HttpUnauthorized;
import com.data.db_instagram.model.Users;
import com.data.db_instagram.repository.IUserRepository;
import com.data.db_instagram.repository.ProfilesRepository;
import com.data.db_instagram.security.jwt.JwtProvider;
import com.data.db_instagram.services.impl.AuthServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Date;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private IUserRepository userRepository;

    @Mock
    private ProfilesRepository profilesRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtProvider jwtProvider;

    @InjectMocks
    private AuthServiceImpl authService;

    private RegisterRequest registerRequest;
    private LoginRequest loginRequest;
    private Users testUser;

    @BeforeEach
    void setUp() {
        registerRequest = new RegisterRequest();
        registerRequest.setEmail("test@example.com");
        registerRequest.setPhone("0123456789");
        registerRequest.setPassword("Password123!");
        registerRequest.setFullName("Test User");

        loginRequest = new LoginRequest();
        loginRequest.setEmail("test@example.com");
        loginRequest.setPassword("Password123!");

        testUser = new Users();
        testUser.setId(UUID.randomUUID());
        testUser.setEmail("test@example.com");
        testUser.setPhone("0123456789");
        testUser.setPassword_hash("$2a$10$encodedPasswordHash");
        testUser.setIs_active(true);
        testUser.setCreated_at(new Date());
    }

    @Test
    void register_NewUser_ReturnsAuthResponse() {
        // Arrange
        when(userRepository.existsByEmail(registerRequest.getEmail())).thenReturn(false);
        when(userRepository.existsByPhone(registerRequest.getPhone())).thenReturn(false);
        when(userRepository.save(any(Users.class))).thenReturn(testUser);
        when(passwordEncoder.encode(anyString())).thenReturn("encodedPassword");
        when(jwtProvider.generateToken(anyString(), any(UUID.class))).thenReturn("testToken");
        when(profilesRepository.save(any())).thenReturn(null);

        // Act
        AuthResponse result = authService.register(registerRequest);

        // Assert
        assertNotNull(result);
        assertNotNull(result.getAccessToken());
        assertNotNull(result.getUser());
        assertEquals("test@example.com", result.getUser().getEmail());
        
        verify(userRepository).save(any(Users.class));
        verify(profilesRepository).save(any());
    }

    @Test
    void register_EmailExists_ThrowsConflictException() {
        // Arrange
        when(userRepository.existsByEmail(registerRequest.getEmail())).thenReturn(true);

        // Act & Assert
        assertThrows(HttpConflict.class, () -> authService.register(registerRequest));
        verify(userRepository, never()).save(any());
    }

    @Test
    void register_PhoneExists_ThrowsConflictException() {
        // Arrange
        when(userRepository.existsByEmail(registerRequest.getEmail())).thenReturn(false);
        when(userRepository.existsByPhone(registerRequest.getPhone())).thenReturn(true);

        // Act & Assert
        assertThrows(HttpConflict.class, () -> authService.register(registerRequest));
        verify(userRepository, never()).save(any());
    }

    @Test
    void login_ValidCredentials_ReturnsAuthResponse() {
        // Arrange
        when(userRepository.findByEmailOrPhone(loginRequest.getEmail(), loginRequest.getEmail()))
            .thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches(loginRequest.getPassword(), testUser.getPassword_hash()))
            .thenReturn(true);
        when(jwtProvider.generateToken(anyString(), any(UUID.class))).thenReturn("testToken");
        when(profilesRepository.findByUserId(any(UUID.class))).thenReturn(Optional.empty());

        // Act
        AuthResponse result = authService.login(loginRequest);

        // Assert
        assertNotNull(result);
        assertNotNull(result.getAccessToken());
        assertNotNull(result.getUser());
        assertEquals("test@example.com", result.getUser().getEmail());
    }

    @Test
    void login_InvalidCredentials_ThrowsUnauthorizedException() {
        // Arrange
        when(userRepository.findByEmailOrPhone(loginRequest.getEmail(), loginRequest.getEmail()))
            .thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(HttpUnauthorized.class, () -> authService.login(loginRequest));
    }

    @Test
    void login_WrongPassword_ThrowsUnauthorizedException() {
        // Arrange
        when(userRepository.findByEmailOrPhone(loginRequest.getEmail(), loginRequest.getEmail()))
            .thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches(loginRequest.getPassword(), testUser.getPassword_hash()))
            .thenReturn(false);

        // Act & Assert
        assertThrows(HttpUnauthorized.class, () -> authService.login(loginRequest));
    }

    @Test
    void login_InactiveAccount_ThrowsUnauthorizedException() {
        // Arrange
        testUser.setIs_active(false);
        when(userRepository.findByEmailOrPhone(loginRequest.getEmail(), loginRequest.getEmail()))
            .thenReturn(Optional.of(testUser));

        // Act & Assert
        assertThrows(HttpUnauthorized.class, () -> authService.login(loginRequest));
    }
}

