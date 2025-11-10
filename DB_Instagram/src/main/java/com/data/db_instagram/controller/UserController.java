package com.data.db_instagram.controller;

import com.data.db_instagram.dto.request.UpdateProfileRequest;
import com.data.db_instagram.dto.response.ResponseWrapper;
import com.data.db_instagram.services.UserService;
import com.data.db_instagram.utils.JwtUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {
        private final UserService userService;
        private final JwtUtils jwtUtils;

        @GetMapping("/me")
        public ResponseEntity<?> getCurrentUser(
                        @RequestHeader(value = "Authorization", required = false) String authorization) {
                UUID userId = jwtUtils.extractUserIdFromToken(authorization);

                return ResponseEntity.ok(
                                ResponseWrapper.builder()
                                                .status(HttpStatus.OK)
                                                .code(HttpStatus.OK.value())
                                                .data(userService.getCurrentUser(userId))
                                                .build());
        }

        @GetMapping("/{userId}")
        public ResponseEntity<?> getUserById(
                        @PathVariable UUID userId) {
                return ResponseEntity.ok(
                                ResponseWrapper.builder()
                                                .status(HttpStatus.OK)
                                                .code(HttpStatus.OK.value())
                                                .data(userService.getUserById(userId))
                                                .build());
        }

        @PutMapping("/me")
        public ResponseEntity<?> updateProfile(
                        @RequestHeader(value = "Authorization", required = false) String authorization,
                        @Valid @RequestBody UpdateProfileRequest request) {
                UUID userId = jwtUtils.extractUserIdFromToken(authorization);

                return ResponseEntity.ok(
                                ResponseWrapper.builder()
                                                .status(HttpStatus.OK)
                                                .code(HttpStatus.OK.value())
                                                .data(userService.updateProfile(userId, request))
                                                .build());
        }
}
