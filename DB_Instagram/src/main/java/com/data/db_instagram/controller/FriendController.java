package com.data.db_instagram.controller;

import com.data.db_instagram.dto.request.AcceptFriendRequestRequest;
import com.data.db_instagram.dto.request.BlockUserRequest;
import com.data.db_instagram.dto.request.SendFriendRequestRequest;
import com.data.db_instagram.dto.response.FriendInfo;
import com.data.db_instagram.dto.response.FriendRequestInfo;
import com.data.db_instagram.dto.response.ResponseWrapper;
import com.data.db_instagram.dto.response.SearchUserResponse;
import com.data.db_instagram.services.FriendService;
import com.data.db_instagram.utils.JwtUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/friends")
@RequiredArgsConstructor
public class FriendController {
    private final FriendService friendService;
    private final JwtUtils jwtUtils;

    @GetMapping("/search")
    public ResponseEntity<?> searchUsersByPhone(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestParam("phone") String phone) {
        UUID userId = jwtUtils.extractUserIdFromToken(authorization);
        
        SearchUserResponse response = friendService.searchUsersByPhone(phone, userId);
        
        return ResponseEntity.ok(
                ResponseWrapper.builder()
                        .status(HttpStatus.OK)
                        .code(HttpStatus.OK.value())
                        .data(response)
                        .build());
    }

    @PostMapping("/requests")
    public ResponseEntity<?> sendFriendRequest(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @Valid @RequestBody SendFriendRequestRequest request) {
        UUID userId = jwtUtils.extractUserIdFromToken(authorization);
        
        FriendRequestInfo response = friendService.sendFriendRequest(request, userId);
        
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ResponseWrapper.builder()
                        .status(HttpStatus.CREATED)
                        .code(HttpStatus.CREATED.value())
                        .data(response)
                        .build());
    }

    @PostMapping("/requests/accept")
    public ResponseEntity<?> acceptFriendRequest(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @Valid @RequestBody AcceptFriendRequestRequest request) {
        UUID userId = jwtUtils.extractUserIdFromToken(authorization);
        
        FriendRequestInfo response = friendService.acceptFriendRequest(request, userId);
        
        return ResponseEntity.ok(
                ResponseWrapper.builder()
                        .status(HttpStatus.OK)
                        .code(HttpStatus.OK.value())
                        .data(response)
                        .build());
    }

    @PostMapping("/requests/{requestId}/reject")
    public ResponseEntity<?> rejectFriendRequest(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable UUID requestId) {
        UUID userId = jwtUtils.extractUserIdFromToken(authorization);
        
        friendService.rejectFriendRequest(requestId, userId);
        
        return ResponseEntity.ok(
                ResponseWrapper.builder()
                        .status(HttpStatus.OK)
                        .code(HttpStatus.OK.value())
                        .data("Friend request rejected successfully")
                        .build());
    }

    @PostMapping("/requests/{requestId}/cancel")
    public ResponseEntity<?> cancelFriendRequest(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable UUID requestId) {
        UUID userId = jwtUtils.extractUserIdFromToken(authorization);
        
        friendService.cancelFriendRequest(requestId, userId);
        
        return ResponseEntity.ok(
                ResponseWrapper.builder()
                        .status(HttpStatus.OK)
                        .code(HttpStatus.OK.value())
                        .data("Friend request cancelled successfully")
                        .build());
    }

    @GetMapping("/requests")
    public ResponseEntity<?> getFriendRequests(
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        UUID userId = jwtUtils.extractUserIdFromToken(authorization);
        
        List<FriendRequestInfo> requests = friendService.getFriendRequests(userId);
        
        return ResponseEntity.ok(
                ResponseWrapper.builder()
                        .status(HttpStatus.OK)
                        .code(HttpStatus.OK.value())
                        .data(requests)
                        .build());
    }

    @GetMapping
    public ResponseEntity<?> getFriends(
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        UUID userId = jwtUtils.extractUserIdFromToken(authorization);
        
        List<FriendInfo> friends = friendService.getFriends(userId);
        
        return ResponseEntity.ok(
                ResponseWrapper.builder()
                        .status(HttpStatus.OK)
                        .code(HttpStatus.OK.value())
                        .data(friends)
                        .build());
    }

    @DeleteMapping("/{friendId}")
    public ResponseEntity<?> unfriend(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable UUID friendId) {
        UUID userId = jwtUtils.extractUserIdFromToken(authorization);
        
        friendService.unfriend(friendId, userId);
        
        return ResponseEntity.ok(
                ResponseWrapper.builder()
                        .status(HttpStatus.OK)
                        .code(HttpStatus.OK.value())
                        .data("Unfriended successfully")
                        .build());
    }

    @PostMapping("/block")
    public ResponseEntity<?> blockUser(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @Valid @RequestBody BlockUserRequest request) {
        UUID userId = jwtUtils.extractUserIdFromToken(authorization);
        
        friendService.blockUser(request, userId);
        
        return ResponseEntity.ok(
                ResponseWrapper.builder()
                        .status(HttpStatus.OK)
                        .code(HttpStatus.OK.value())
                        .data("User blocked successfully")
                        .build());
    }

    @DeleteMapping("/block/{blockedUserId}")
    public ResponseEntity<?> unblockUser(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable UUID blockedUserId) {
        UUID userId = jwtUtils.extractUserIdFromToken(authorization);
        
        friendService.unblockUser(blockedUserId, userId);
        
        return ResponseEntity.ok(
                ResponseWrapper.builder()
                        .status(HttpStatus.OK)
                        .code(HttpStatus.OK.value())
                        .data("User unblocked successfully")
                        .build());
    }

    @GetMapping("/blocked")
    public ResponseEntity<?> getBlockedUsers(
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        UUID userId = jwtUtils.extractUserIdFromToken(authorization);
        
        List<FriendInfo> blockedUsers = friendService.getBlockedUsers(userId);
        
        return ResponseEntity.ok(
                ResponseWrapper.builder()
                        .status(HttpStatus.OK)
                        .code(HttpStatus.OK.value())
                        .data(blockedUsers)
                        .build());
    }

    @GetMapping("/{userId}")
    public ResponseEntity<?> getUserFriends(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable UUID userId) {
        // Allow getting friends of any user (for viewing their profile)
        List<FriendInfo> friends = friendService.getFriends(userId);
        
        return ResponseEntity.ok(
                ResponseWrapper.builder()
                        .status(HttpStatus.OK)
                        .code(HttpStatus.OK.value())
                        .data(friends)
                        .build());
    }
}

