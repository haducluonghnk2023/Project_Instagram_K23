package com.data.db_instagram.services;

import com.data.db_instagram.dto.request.UpdateProfileRequest;
import com.data.db_instagram.dto.response.UserInfo;
import com.data.db_instagram.exception.HttpNotFound;
import com.data.db_instagram.model.Profiles;
import com.data.db_instagram.model.Users;
import com.data.db_instagram.repository.IUserRepository;
import com.data.db_instagram.repository.ProfilesRepository;
import com.data.db_instagram.services.impl.UserServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Date;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private IUserRepository userRepository;

    @Mock
    private ProfilesRepository profilesRepository;

    @InjectMocks
    private UserServiceImpl userService;

    private UUID userId;
    private Users testUser;
    private Profiles testProfile;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        
        testUser = new Users();
        testUser.setId(userId);
        testUser.setEmail("test@example.com");
        testUser.setPhone("0123456789");
        testUser.setIs_active(true);
        testUser.setCreated_at(new Date());

        testProfile = new Profiles();
        testProfile.setId(UUID.randomUUID());
        testProfile.setUser_id(userId);
        testProfile.setFull_name("Test User");
        testProfile.setBio("Test bio");
        testProfile.setCreated_at(new Date());
    }

    @Test
    void getCurrentUser_UserExists_ReturnsUserInfo() {
        // Arrange
        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
        when(profilesRepository.findByUserId(userId)).thenReturn(Optional.of(testProfile));

        // Act
        UserInfo result = userService.getCurrentUser(userId);

        // Assert
        assertNotNull(result);
        assertEquals(userId, result.getId());
        assertEquals("test@example.com", result.getEmail());
        assertNotNull(result.getProfile());
        assertEquals("Test User", result.getProfile().getFullName());
        
        verify(userRepository).findById(userId);
        verify(profilesRepository).findByUserId(userId);
    }

    @Test
    void getCurrentUser_UserNotFound_ThrowsException() {
        // Arrange
        when(userRepository.findById(userId)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(HttpNotFound.class, () -> userService.getCurrentUser(userId));
        verify(userRepository).findById(userId);
        verify(profilesRepository, never()).findByUserId(any());
    }

    @Test
    void updateProfile_ProfileExists_UpdatesSuccessfully() {
        // Arrange
        UpdateProfileRequest request = new UpdateProfileRequest();
        request.setFullName("Updated Name");
        request.setBio("Updated bio");

        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
        when(profilesRepository.findByUserId(userId)).thenReturn(Optional.of(testProfile));
        when(profilesRepository.save(any(Profiles.class))).thenReturn(testProfile);

        // Act
        UserInfo result = userService.updateProfile(userId, request);

        // Assert
        assertNotNull(result);
        assertEquals("Updated Name", result.getProfile().getFullName());
        verify(profilesRepository).save(any(Profiles.class));
    }

    @Test
    void updateProfile_ProfileNotExists_CreatesNewProfile() {
        // Arrange
        UpdateProfileRequest request = new UpdateProfileRequest();
        request.setFullName("New Profile");

        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
        when(profilesRepository.findByUserId(userId)).thenReturn(Optional.empty());
        when(profilesRepository.save(any(Profiles.class))).thenReturn(testProfile);

        // Act
        UserInfo result = userService.updateProfile(userId, request);

        // Assert
        assertNotNull(result);
        verify(profilesRepository).save(any(Profiles.class));
    }

    @Test
    void updateProfile_UserNotFound_ThrowsException() {
        // Arrange
        UpdateProfileRequest request = new UpdateProfileRequest();
        when(userRepository.findById(userId)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(HttpNotFound.class, () -> userService.updateProfile(userId, request));
        verify(profilesRepository, never()).save(any());
    }
}

