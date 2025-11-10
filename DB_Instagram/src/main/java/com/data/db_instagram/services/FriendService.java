package com.data.db_instagram.services;

import com.data.db_instagram.dto.request.AcceptFriendRequestRequest;
import com.data.db_instagram.dto.request.BlockUserRequest;
import com.data.db_instagram.dto.request.SendFriendRequestRequest;
import com.data.db_instagram.dto.response.FriendInfo;
import com.data.db_instagram.dto.response.FriendRequestInfo;
import com.data.db_instagram.dto.response.SearchUserResponse;

import java.util.List;
import java.util.UUID;

public interface FriendService {
    SearchUserResponse searchUsersByPhone(String phone, UUID currentUserId);

    FriendRequestInfo sendFriendRequest(SendFriendRequestRequest request, UUID fromUserId);

    FriendRequestInfo acceptFriendRequest(AcceptFriendRequestRequest request, UUID userId);

    void rejectFriendRequest(UUID requestId, UUID userId);

    void cancelFriendRequest(UUID requestId, UUID userId);

    void unfriend(UUID friendId, UUID userId);

    List<FriendRequestInfo> getFriendRequests(UUID userId);

    List<FriendInfo> getFriends(UUID userId);

    void blockUser(BlockUserRequest request, UUID blockerId);

    void unblockUser(UUID blockedUserId, UUID blockerId);

    List<FriendInfo> getBlockedUsers(UUID blockerId);
}
