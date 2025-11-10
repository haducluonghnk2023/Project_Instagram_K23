package com.data.db_instagram.services.impl;

import com.data.db_instagram.dto.request.AcceptFriendRequestRequest;
import com.data.db_instagram.dto.request.BlockUserRequest;
import com.data.db_instagram.dto.request.SendFriendRequestRequest;
import com.data.db_instagram.dto.response.FriendInfo;
import com.data.db_instagram.dto.response.FriendRequestInfo;
import com.data.db_instagram.dto.response.SearchUserResponse;
import com.data.db_instagram.dto.response.UserInfo;
import com.data.db_instagram.exception.HttpBadRequest;
import com.data.db_instagram.exception.HttpConflict;
import com.data.db_instagram.exception.HttpForbidden;
import com.data.db_instagram.exception.HttpNotFound;
import com.data.db_instagram.mapper.UserMapper;
import com.data.db_instagram.model.Blocks;
import com.data.db_instagram.model.Friend_requests;
import com.data.db_instagram.model.Friends;
import com.data.db_instagram.model.Profiles;
import com.data.db_instagram.model.Users;
import com.data.db_instagram.repository.BlockRepository;
import com.data.db_instagram.repository.FriendRepository;
import com.data.db_instagram.repository.FriendRequestRepository;
import com.data.db_instagram.repository.IUserRepository;
import com.data.db_instagram.repository.ProfilesRepository;
import com.data.db_instagram.services.FriendService;
import com.data.db_instagram.services.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FriendServiceImpl implements FriendService {
    private final IUserRepository userRepository;
    private final ProfilesRepository profilesRepository;
    private final FriendRequestRepository friendRequestRepository;
    private final FriendRepository friendRepository;
    private final BlockRepository blockRepository;
    private final UserMapper userMapper;
    private final NotificationService notificationService;

    @Override
    public SearchUserResponse searchUsersByPhone(String phone, UUID currentUserId) {
        // Search by both email and phone
        List<Users> users = userRepository.findByEmailContainingOrPhoneContaining(phone, phone);

        List<UserInfo> userInfos = users.stream()
                .filter(user -> !user.getId().equals(currentUserId))
                .filter(user -> !isBlocked(currentUserId, user.getId()))
                .map(user -> {
                    Profiles profile = profilesRepository.findByUserId(user.getId()).orElse(null);
                    return userMapper.toUserInfo(user, profile);
                })
                .collect(Collectors.toList());

        return SearchUserResponse.builder()
                .users(userInfos)
                .total(userInfos.size())
                .build();
    }

    @Override
    @Transactional
    public FriendRequestInfo sendFriendRequest(SendFriendRequestRequest request, UUID fromUserId) {
        // Find user by phone
        Users toUser = userRepository.findByPhone(request.getPhone())
                .orElseThrow(() -> new HttpNotFound("User not found with phone: " + request.getPhone()));

        if (toUser.getId().equals(fromUserId)) {
            throw new HttpBadRequest("Cannot send friend request to yourself");
        }

        if (isFriend(fromUserId, toUser.getId())) {
            throw new HttpConflict("You are already friends with this user");
        }

        // Check if blocked
        if (isBlocked(fromUserId, toUser.getId()) || isBlocked(toUser.getId(), fromUserId)) {
            throw new HttpForbidden("Cannot send friend request to blocked user");
        }

        Optional<Friend_requests> existingRequest = friendRequestRepository
                .findByFromUserAndToUserAndStatus(fromUserId, toUser.getId(), "pending");

        if (existingRequest.isPresent()) {
            throw new HttpConflict("Friend request already sent");
        }

        // Check if reverse request exists
        Optional<Friend_requests> reverseRequest = friendRequestRepository
                .findByFromUserAndToUserAndStatus(toUser.getId(), fromUserId, "pending");

        if (reverseRequest.isPresent()) {
            throw new HttpConflict("This user has already sent you a friend request");
        }

        // Create friend request
        Friend_requests friendRequest = new Friend_requests();
        friendRequest.setFrom_user(fromUserId);
        friendRequest.setTo_user(toUser.getId());
        friendRequest.setMessage(request.getMessage());
        friendRequest.setStatus("pending");
        friendRequest.setCreated_at(new Date());

        friendRequest = friendRequestRepository.save(friendRequest);

        // Create notification for recipient
        String payload = "{\"requestId\":\"" + friendRequest.getId() + "\",\"message\":\"" + 
                (request.getMessage() != null ? request.getMessage().replace("\"", "\\\"") : "") + "\"}";
        notificationService.createNotification(toUser.getId(), fromUserId, "friend_request", payload);

        // Build response
        Users fromUser = userRepository.findById(fromUserId).orElseThrow();
        Profiles fromProfile = profilesRepository.findByUserId(fromUserId).orElse(null);
        Profiles toProfile = profilesRepository.findByUserId(toUser.getId()).orElse(null);

        return FriendRequestInfo.builder()
                .id(friendRequest.getId())
                .fromUserId(friendRequest.getFrom_user())
                .toUserId(friendRequest.getTo_user())
                .message(friendRequest.getMessage())
                .status(friendRequest.getStatus())
                .createdAt(friendRequest.getCreated_at())
                .updatedAt(friendRequest.getUpdated_at())
                .fromUser(userMapper.toUserInfo(fromUser, fromProfile))
                .toUser(userMapper.toUserInfo(toUser, toProfile))
                .build();
    }

    @Override
    @Transactional
    public FriendRequestInfo acceptFriendRequest(AcceptFriendRequestRequest request, UUID userId) {
        Friend_requests friendRequest = friendRequestRepository.findById(request.getRequestId())
                .orElseThrow(() -> new HttpNotFound("Friend request not found"));

        if (!friendRequest.getTo_user().equals(userId)) {
            throw new HttpForbidden("You are not authorized to accept this request");
        }

        if (!"pending".equals(friendRequest.getStatus())) {
            throw new HttpBadRequest("Friend request is not pending");
        }

        // Update request status
        friendRequest.setStatus("accepted");
        friendRequest.setUpdated_at(new Date());
        friendRequest = friendRequestRepository.save(friendRequest);

        // Create friendship (bidirectional)
        if (!isFriend(friendRequest.getFrom_user(), friendRequest.getTo_user())) {
            Friends friendship = new Friends();
            friendship.setUser_a(friendRequest.getFrom_user());
            friendship.setUser_b(friendRequest.getTo_user());
            friendship.setSince(new Date());
            friendRepository.save(friendship);
        }

        // Build response
        Users fromUser = userRepository.findById(friendRequest.getFrom_user()).orElseThrow();
        Users toUser = userRepository.findById(friendRequest.getTo_user()).orElseThrow();
        Profiles fromProfile = profilesRepository.findByUserId(friendRequest.getFrom_user()).orElse(null);
        Profiles toProfile = profilesRepository.findByUserId(friendRequest.getTo_user()).orElse(null);

        return FriendRequestInfo.builder()
                .id(friendRequest.getId())
                .fromUserId(friendRequest.getFrom_user())
                .toUserId(friendRequest.getTo_user())
                .message(friendRequest.getMessage())
                .status(friendRequest.getStatus())
                .createdAt(friendRequest.getCreated_at())
                .updatedAt(friendRequest.getUpdated_at())
                .fromUser(userMapper.toUserInfo(fromUser, fromProfile))
                .toUser(userMapper.toUserInfo(toUser, toProfile))
                .build();
    }

    @Override
    @Transactional
    public void rejectFriendRequest(UUID requestId, UUID userId) {
        Friend_requests friendRequest = friendRequestRepository.findById(requestId)
                .orElseThrow(() -> new HttpNotFound("Friend request not found"));

        if (!friendRequest.getTo_user().equals(userId)) {
            throw new HttpForbidden("You are not authorized to reject this request");
        }

        if (!"pending".equals(friendRequest.getStatus())) {
            throw new HttpBadRequest("Friend request is not pending");
        }

        friendRequest.setStatus("rejected");
        friendRequest.setUpdated_at(new Date());
        friendRequestRepository.save(friendRequest);
    }

    @Override
    @Transactional
    public void cancelFriendRequest(UUID requestId, UUID userId) {
        Friend_requests friendRequest = friendRequestRepository.findById(requestId)
                .orElseThrow(() -> new HttpNotFound("Friend request not found"));

        if (!friendRequest.getFrom_user().equals(userId)) {
            throw new HttpForbidden("You are not authorized to cancel this request");
        }

        if (!"pending".equals(friendRequest.getStatus())) {
            throw new HttpBadRequest("Friend request is not pending");
        }

        friendRequest.setStatus("cancelled");
        friendRequest.setUpdated_at(new Date());
        friendRequestRepository.save(friendRequest);
    }

    @Override
    @Transactional
    public void unfriend(UUID friendId, UUID userId) {
        // Find all friendships between the two users (handle both directions and duplicates)
        List<Friends> friendships = friendRepository.findByUserAOrUserB(userId).stream()
                .filter(f -> {
                    UUID otherUserId = f.getUser_a().equals(userId) ? f.getUser_b() : f.getUser_a();
                    return otherUserId.equals(friendId);
                })
                .collect(Collectors.toList());

        if (friendships.isEmpty()) {
            throw new HttpNotFound("Friendship not found");
        }

        // Delete all friendships found (in case of duplicates)
        friendRepository.deleteAll(friendships);
    }

    @Override
    public List<FriendRequestInfo> getFriendRequests(UUID userId) {
        // Get both incoming (toUserId = userId) and outgoing (fromUserId = userId) requests
        List<Friend_requests> incomingRequests = friendRequestRepository.findByToUserAndStatus(userId, "pending");
        List<Friend_requests> outgoingRequests = friendRequestRepository.findByFromUserAndStatus(userId, "pending");
        
        // Combine both lists
        List<Friend_requests> allRequests = new ArrayList<>();
        allRequests.addAll(incomingRequests);
        allRequests.addAll(outgoingRequests);

        return allRequests.stream().map(request -> {
            Users fromUser = userRepository.findById(request.getFrom_user()).orElse(null);
            Users toUser = userRepository.findById(request.getTo_user()).orElse(null);
            Profiles fromProfile = profilesRepository.findByUserId(request.getFrom_user()).orElse(null);
            Profiles toProfile = profilesRepository.findByUserId(request.getTo_user()).orElse(null);

            return FriendRequestInfo.builder()
                    .id(request.getId())
                    .fromUserId(request.getFrom_user())
                    .toUserId(request.getTo_user())
                    .message(request.getMessage())
                    .status(request.getStatus())
                    .createdAt(request.getCreated_at())
                    .updatedAt(request.getUpdated_at())
                    .fromUser(userMapper.toUserInfo(fromUser, fromProfile))
                    .toUser(userMapper.toUserInfo(toUser, toProfile))
                    .build();
        }).collect(Collectors.toList());
    }

    @Override
    public List<FriendInfo> getFriends(UUID userId) {
        List<Friends> friendships = friendRepository.findByUserAOrUserB(userId);

        return friendships.stream()
                .filter(friendship -> {
                    UUID friendUserId = friendship.getUser_a().equals(userId)
                            ? friendship.getUser_b()
                            : friendship.getUser_a();
                    // Filter out blocked users (both directions)
                    return !isBlocked(userId, friendUserId) && !isBlocked(friendUserId, userId);
                })
                .map(friendship -> {
                    UUID friendUserId = friendship.getUser_a().equals(userId)
                            ? friendship.getUser_b()
                            : friendship.getUser_a();

                    Users friendUser = userRepository.findById(friendUserId).orElse(null);
                    Profiles friendProfile = profilesRepository.findByUserId(friendUserId).orElse(null);

                    return FriendInfo.builder()
                            .id(friendship.getId())
                            .userId(friendUserId)
                            .since(friendship.getSince())
                            .user(userMapper.toUserInfo(friendUser, friendProfile))
                            .build();
                })
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void blockUser(BlockUserRequest request, UUID blockerId) {
        if (blockerId.equals(request.getUserId())) {
            throw new HttpBadRequest("Cannot block yourself");
        }

        Users blockedUser = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new HttpNotFound("User not found"));

        if (blockRepository.existsByBlockerAndBlocked(blockerId, request.getUserId())) {
            throw new HttpConflict("User is already blocked");
        }

        // Cancel any pending friend requests from blocker to blocked user
        friendRequestRepository.findByFromUserAndToUser(blockerId, request.getUserId())
                .ifPresent(fr -> {
                    if ("pending".equals(fr.getStatus())) {
                        fr.setStatus("cancelled");
                        fr.setUpdated_at(new Date());
                        friendRequestRepository.save(fr);
                    }
                });

        // Reject any pending friend requests from blocked user to blocker
        friendRequestRepository.findByFromUserAndToUser(request.getUserId(), blockerId)
                .ifPresent(fr -> {
                    if ("pending".equals(fr.getStatus())) {
                        fr.setStatus("rejected");
                        fr.setUpdated_at(new Date());
                        friendRequestRepository.save(fr);
                    }
                });

        // Note: We do NOT delete the friendship when blocking
        // The friendship will be filtered out in getFriends() method
        // This allows unblocking to restore the friendship status

        Blocks block = new Blocks();
        block.setBlocker(blockerId);
        block.setBlocked(request.getUserId());
        block.setCreated_at(new Date());
        blockRepository.save(block);
    }

    @Override
    @Transactional
    public void unblockUser(UUID blockedUserId, UUID blockerId) {
        Blocks block = blockRepository.findByBlockerAndBlocked(blockerId, blockedUserId)
                .orElseThrow(() -> new HttpNotFound("User is not blocked"));

        blockRepository.delete(block);
    }

    @Override
    public List<FriendInfo> getBlockedUsers(UUID blockerId) {
        List<Blocks> blocks = blockRepository.findByBlocker(blockerId);

        return blocks.stream().map(block -> {
            UUID blockedUserId = block.getBlocked();
            Users blockedUser = userRepository.findById(blockedUserId).orElse(null);
            Profiles blockedProfile = profilesRepository.findByUserId(blockedUserId).orElse(null);

            return FriendInfo.builder()
                    .id(block.getId())
                    .userId(blockedUserId)
                    .since(block.getCreated_at())
                    .user(userMapper.toUserInfo(blockedUser, blockedProfile))
                    .build();
        }).collect(Collectors.toList());
    }

    private boolean isFriend(UUID userA, UUID userB) {
        return friendRepository.existsByUserAAndUserB(userA, userB);
    }

    private boolean isBlocked(UUID blocker, UUID blocked) {
        return blockRepository.existsByBlockerAndBlocked(blocker, blocked);
    }
}
