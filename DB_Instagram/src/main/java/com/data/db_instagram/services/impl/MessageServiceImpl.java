package com.data.db_instagram.services.impl;

import com.data.db_instagram.dto.request.ReactToMessageRequest;
import com.data.db_instagram.dto.request.SendMessageRequest;
import com.data.db_instagram.dto.response.*;
import com.data.db_instagram.exception.HttpBadRequest;
import com.data.db_instagram.exception.HttpForbidden;
import com.data.db_instagram.exception.HttpNotFound;
import com.data.db_instagram.mapper.UserMapper;
import com.data.db_instagram.model.*;
import com.data.db_instagram.repository.*;
import com.data.db_instagram.services.MessageService;
import com.data.db_instagram.services.NotificationService;
import com.data.db_instagram.handler.MessageWebSocketHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@lombok.extern.slf4j.Slf4j
public class MessageServiceImpl implements MessageService {
    private final MessagesRepository messagesRepository;
    private final MessageMediaRepository messageMediaRepository;
    private final MessageReactionsRepository messageReactionsRepository;
    private final IUserRepository userRepository;
    private final ProfilesRepository profilesRepository;
    private final UserMapper userMapper;
    private final NotificationService notificationService;
    private final MessageWebSocketHandler webSocketHandler;

    @Override
    @Transactional
    public MessageResponse sendMessage(SendMessageRequest request, UUID fromUserId) {
        if ((request.getContent() == null || request.getContent().trim().isEmpty())
            && (request.getMediaUrls() == null || request.getMediaUrls().isEmpty())) {
            throw new HttpBadRequest("Message must have either content or media");
        }

        Users toUser = userRepository.findById(request.getToUserId())
                .orElseThrow(() -> new HttpNotFound("User not found"));

        // Cho phép tự nhắn tin (self-messaging) - giống Instagram/Facebook
        // Khi tự nhắn tin, tự động đánh dấu là đã đọc
        boolean isSelfMessage = fromUserId.equals(request.getToUserId());

        Messages message = new Messages();
        message.setFrom_user(fromUserId);
        message.setTo_user(request.getToUserId());
        message.setContent(request.getContent() != null && !request.getContent().trim().isEmpty() 
            ? request.getContent().trim() : null);
        // Nếu tự nhắn tin, tự động đánh dấu là đã đọc
        message.setIs_read(isSelfMessage);
        message.setCreated_at(new Date());
        message = messagesRepository.save(message);

        if (request.getMediaUrls() != null && !request.getMediaUrls().isEmpty()) {
            for (String mediaUrl : request.getMediaUrls()) {
                Message_media media = new Message_media();
                media.setMessage_id(message.getId());
                media.setMedia_url(mediaUrl);
                String lowerUrl = mediaUrl.toLowerCase();
                boolean isVideo = lowerUrl.contains("/video/") || 
                                  lowerUrl.contains("resource_type=video") ||
                                  lowerUrl.contains(".mp4") ||
                                  lowerUrl.contains(".mov") ||
                                  lowerUrl.contains(".avi") ||
                                  lowerUrl.contains(".mpeg");
                media.setMedia_type(isVideo ? "video" : "image");
                messageMediaRepository.save(media);
            }
        }

        String payload = "{\"messageId\":\"" + message.getId() + "\"}";
        notificationService.createNotification(request.getToUserId(), fromUserId, "message_new", payload);

        MessageResponse response = buildMessageResponse(message, fromUserId);
        
        try {
            webSocketHandler.sendMessageToUser(
                request.getToUserId().toString(),
                Map.of("type", "new_message", "message", response)
            );
            log.debug("Message broadcasted via WebSocket to user: {}", request.getToUserId());
        } catch (Exception e) {
            log.warn("Failed to broadcast message via WebSocket: {}", e.getMessage());
        }
        
        try {
            webSocketHandler.sendMessageToUser(
                fromUserId.toString(),
                Map.of("type", "message_sent", "message", response)
            );
        } catch (Exception e) {
            log.warn("Failed to send confirmation via WebSocket to sender: {}", e.getMessage());
        }

        return response;
    }

    @Override
    public List<MessageResponse> getConversation(UUID currentUserId, UUID otherUserId) {
        List<Messages> messages = messagesRepository.findConversationBetweenUsers(currentUserId, otherUserId);
        if (messages.isEmpty()) {
            return new ArrayList<>();
        }
        
        // Batch load để tránh N+1 query
        return buildMessageResponses(messages, currentUserId);
    }

    @Override
    public List<ConversationInfo> getConversations(UUID userId) {
        // Tối ưu: chỉ lấy message cuối cùng của mỗi conversation
        List<Messages> lastMessages = messagesRepository.findLastMessagesByUserId(userId);
        
        // Extract unique user IDs từ last messages
        Set<UUID> conversationUserIds = new HashSet<>();
        Map<UUID, Messages> lastMessageMap = new HashMap<>();
        
        for (Messages message : lastMessages) {
            UUID otherUserId = message.getFrom_user().equals(userId) 
                ? message.getTo_user() 
                : message.getFrom_user();
            conversationUserIds.add(otherUserId);
            lastMessageMap.put(otherUserId, message);
        }
        
        List<ConversationInfo> conversations = new ArrayList<>();
        
        // Batch load users và profiles để tránh N+1 query
        List<Users> otherUsers = userRepository.findAllById(conversationUserIds);
        Map<UUID, Users> userMap = otherUsers.stream()
            .collect(Collectors.toMap(Users::getId, u -> u));
        
        List<Profiles> otherProfiles = profilesRepository.findByUserIdIn(new ArrayList<>(conversationUserIds));
        Map<UUID, Profiles> profileMap = otherProfiles.stream()
            .collect(Collectors.toMap(Profiles::getUser_id, p -> p));
        
        for (UUID otherUserId : conversationUserIds) {
            Users otherUser = userMap.get(otherUserId);
            if (otherUser == null) continue;
            
            Profiles otherProfile = profileMap.get(otherUserId);
            UserInfo otherUserInfo = userMapper.toUserInfo(otherUser, otherProfile);
            
            // Get last message từ map
            Messages lastMessage = lastMessageMap.get(otherUserId);
            
            // Get unread count
            long unreadCount = messagesRepository.countUnreadMessages(userId, otherUserId);
            
            ConversationInfo conversation = ConversationInfo.builder()
                    .userId(otherUserId)
                    .user(otherUserInfo)
                    .lastMessage(lastMessage != null ? buildMessageResponse(lastMessage, userId) : null)
                    .unreadCount(unreadCount)
                    .lastMessageAt(lastMessage != null ? lastMessage.getCreated_at() : null)
                    .build();
            
            conversations.add(conversation);
        }
        
        // Sort by last message time (most recent first)
        conversations.sort((a, b) -> {
            if (a.getLastMessageAt() == null && b.getLastMessageAt() == null) return 0;
            if (a.getLastMessageAt() == null) return 1;
            if (b.getLastMessageAt() == null) return -1;
            return b.getLastMessageAt().compareTo(a.getLastMessageAt());
        });
        
        return conversations;
    }

    @Override
    @Transactional
    public MessageResponse markAsRead(UUID messageId, UUID userId) {
        Messages message = messagesRepository.findById(messageId)
                .orElseThrow(() -> new HttpNotFound("Message not found"));

        if (!message.getTo_user().equals(userId)) {
            throw new HttpForbidden("You can only mark your own received messages as read");
        }

        message.setIs_read(true);
        message.setUpdated_at(new Date());
        message = messagesRepository.save(message);

        return buildMessageResponse(message, userId);
    }

    @Override
    @Transactional
    public void markAllAsRead(UUID currentUserId, UUID otherUserId) {
        List<Messages> unreadMessages = messagesRepository.findConversationBetweenUsers(currentUserId, otherUserId)
                .stream()
                .filter(m -> m.getTo_user().equals(currentUserId) && !m.getIs_read())
                .collect(Collectors.toList());

        Date now = new Date();
        for (Messages message : unreadMessages) {
            message.setIs_read(true);
            message.setUpdated_at(now);
        }
        messagesRepository.saveAll(unreadMessages);
    }

    @Override
    @Transactional
    public MessageResponse reactToMessage(UUID messageId, ReactToMessageRequest request, UUID userId) {
        Messages message = messagesRepository.findById(messageId)
                .orElseThrow(() -> new HttpNotFound("Message not found"));

        // Check if user already reacted
        Optional<Message_reactions> existingReaction = messageReactionsRepository
                .findByMessageIdAndUserId(messageId, userId);

        if (existingReaction.isPresent()) {
            // Update existing reaction
            Message_reactions reaction = existingReaction.get();
            reaction.setEmoji(request.getEmoji());
            messageReactionsRepository.save(reaction);
        } else {
            // Create new reaction
            Message_reactions reaction = new Message_reactions();
            reaction.setMessage_id(messageId);
            reaction.setUser_id(userId);
            reaction.setEmoji(request.getEmoji());
            reaction.setCreated_at(new Date());
            messageReactionsRepository.save(reaction);
        }

        return buildMessageResponse(message, userId);
    }

    @Override
    @Transactional
    public void removeReaction(UUID messageId, UUID userId) {
        Message_reactions reaction = messageReactionsRepository
                .findByMessageIdAndUserId(messageId, userId)
                .orElseThrow(() -> new HttpNotFound("Reaction not found"));

        messageReactionsRepository.delete(reaction);
    }

    @Override
    @Transactional
    public void deleteMessage(UUID messageId, UUID userId) {
        Messages message = messagesRepository.findById(messageId)
                .orElseThrow(() -> new HttpNotFound("Message not found"));

        if (!message.getFrom_user().equals(userId)) {
            throw new HttpForbidden("You can only delete your own messages");
        }

        // Delete related media
        messageMediaRepository.deleteByMessage_id(messageId);
        
        // Delete related reactions
        messageReactionsRepository.deleteByMessage_id(messageId);
        
        // Delete message
        messagesRepository.delete(message);
    }

    // Batch build messages để tránh N+1 query problem
    private List<MessageResponse> buildMessageResponses(List<Messages> messages, UUID currentUserId) {
        if (messages.isEmpty()) {
            return new ArrayList<>();
        }
        
        // Collect all user IDs
        Set<UUID> userIds = new HashSet<>();
        for (Messages message : messages) {
            userIds.add(message.getFrom_user());
            userIds.add(message.getTo_user());
        }
        
        // Batch load users và profiles
        List<Users> users = userRepository.findAllById(userIds);
        Map<UUID, Users> userMap = users.stream()
                .collect(Collectors.toMap(Users::getId, u -> u));
        
        List<Profiles> profiles = profilesRepository.findByUserIdIn(new ArrayList<>(userIds));
        Map<UUID, Profiles> profileMap = profiles.stream()
                .collect(Collectors.toMap(Profiles::getUser_id, p -> p));
        
        // Collect all message IDs for batch loading media, reactions
        List<UUID> messageIds = messages.stream().map(Messages::getId).collect(Collectors.toList());
        
        // Batch load media - optimized: single query instead of N queries
        List<Message_media> allMedia = messageMediaRepository.findByMessage_idIn(messageIds);
        Map<UUID, List<Message_media>> mediaMap = allMedia.stream()
                .collect(Collectors.groupingBy(Message_media::getMessage_id));
        
        // Batch load reactions - optimized: single query instead of N queries
        List<Message_reactions> allReactions = messageReactionsRepository.findByMessage_idIn(messageIds);
        Map<UUID, List<Message_reactions>> reactionsMap = allReactions.stream()
                .collect(Collectors.groupingBy(Message_reactions::getMessage_id));
        
        // Collect reaction user IDs
        Set<UUID> reactionUserIds = allReactions.stream()
                .map(Message_reactions::getUser_id)
                .collect(Collectors.toSet());
        
        // Batch load reaction users và profiles
        List<Users> reactionUsers = userRepository.findAllById(reactionUserIds);
        Map<UUID, Users> reactionUserMap = reactionUsers.stream()
                .collect(Collectors.toMap(Users::getId, u -> u));
        
        List<Profiles> reactionProfiles = profilesRepository.findByUserIdIn(new ArrayList<>(reactionUserIds));
        Map<UUID, Profiles> reactionProfileMap = reactionProfiles.stream()
                .collect(Collectors.toMap(Profiles::getUser_id, p -> p));
        
        // Batch check reactions for current user
        Set<UUID> reactedMessageIds = new HashSet<>();
        for (Message_reactions reaction : allReactions) {
            if (reaction.getUser_id().equals(currentUserId)) {
                reactedMessageIds.add(reaction.getMessage_id());
            }
        }
        
        // Build responses
        return messages.stream()
                .map(message -> buildMessageResponseOptimized(
                    message,
                    currentUserId,
                    userMap,
                    profileMap,
                    mediaMap.getOrDefault(message.getId(), Collections.emptyList()),
                    reactionsMap.getOrDefault(message.getId(), Collections.emptyList()),
                    reactionUserMap,
                    reactionProfileMap,
                    reactedMessageIds.contains(message.getId())
                ))
                .collect(Collectors.toList());
    }
    
    private MessageResponse buildMessageResponse(Messages message, UUID currentUserId) {
        Users fromUser = userRepository.findById(message.getFrom_user()).orElse(null);
        Users toUser = userRepository.findById(message.getTo_user()).orElse(null);
        
        Profiles fromProfile = fromUser != null ? profilesRepository.findByUserId(fromUser.getId()).orElse(null) : null;
        Profiles toProfile = toUser != null ? profilesRepository.findByUserId(toUser.getId()).orElse(null) : null;
        
        UserInfo fromUserInfo = userMapper.toUserInfo(fromUser, fromProfile);
        UserInfo toUserInfo = userMapper.toUserInfo(toUser, toProfile);

        // Get media
        List<Message_media> mediaList = messageMediaRepository.findByMessage_id(message.getId());
        List<MessageMediaInfo> mediaInfo = mediaList.stream()
                .map(m -> MessageMediaInfo.builder()
                        .id(m.getId())
                        .mediaUrl(m.getMedia_url())
                        .mediaType(m.getMedia_type())
                        .build())
                .collect(Collectors.toList());

        // Get reactions
        List<Message_reactions> reactions = messageReactionsRepository.findByMessage_idOrderByCreated_atDesc(message.getId());
        List<MessageReactionInfo> reactionInfo = reactions.stream()
                .map(r -> {
                    Users rUser = userRepository.findById(r.getUser_id()).orElse(null);
                    Profiles rProfile = rUser != null ? profilesRepository.findByUserId(rUser.getId()).orElse(null) : null;
                    UserInfo rUserInfo = userMapper.toUserInfo(rUser, rProfile);
                    
                    return MessageReactionInfo.builder()
                            .id(r.getId())
                            .userId(r.getUser_id())
                            .emoji(r.getEmoji() != null ? r.getEmoji() : "❤️")
                            .createdAt(r.getCreated_at())
                            .user(rUserInfo)
                            .build();
                })
                .collect(Collectors.toList());

        boolean hasReacted = messageReactionsRepository.existsByMessageIdAndUserId(message.getId(), currentUserId);

        return MessageResponse.builder()
                .id(message.getId())
                .fromUserId(message.getFrom_user())
                .toUserId(message.getTo_user())
                .content(message.getContent())
                .isRead(message.getIs_read())
                .createdAt(message.getCreated_at())
                .updatedAt(message.getUpdated_at())
                .fromUser(fromUserInfo)
                .toUser(toUserInfo)
                .media(mediaInfo)
                .reactions(reactionInfo)
                .hasReacted(hasReacted)
                .build();
    }
    
    // Optimized version sử dụng pre-loaded data để tránh N+1 query
    private MessageResponse buildMessageResponseOptimized(
            Messages message,
            UUID currentUserId,
            Map<UUID, Users> userMap,
            Map<UUID, Profiles> profileMap,
            List<Message_media> mediaList,
            List<Message_reactions> reactions,
            Map<UUID, Users> reactionUserMap,
            Map<UUID, Profiles> reactionProfileMap,
            boolean hasReacted
    ) {
        Users fromUser = userMap.get(message.getFrom_user());
        Users toUser = userMap.get(message.getTo_user());
        
        Profiles fromProfile = profileMap.get(message.getFrom_user());
        Profiles toProfile = profileMap.get(message.getTo_user());
        
        UserInfo fromUserInfo = userMapper.toUserInfo(fromUser, fromProfile);
        UserInfo toUserInfo = userMapper.toUserInfo(toUser, toProfile);

        // Build media info
        List<MessageMediaInfo> mediaInfo = mediaList.stream()
                .map(m -> MessageMediaInfo.builder()
                        .id(m.getId())
                        .mediaUrl(m.getMedia_url())
                        .mediaType(m.getMedia_type())
                        .build())
                .collect(Collectors.toList());

        // Build reactions info
        List<MessageReactionInfo> reactionInfo = reactions.stream()
                .map(r -> {
                    Users rUser = reactionUserMap.get(r.getUser_id());
                    Profiles rProfile = reactionProfileMap.get(r.getUser_id());
                    UserInfo rUserInfo = userMapper.toUserInfo(rUser, rProfile);
                    
                    return MessageReactionInfo.builder()
                            .id(r.getId())
                            .userId(r.getUser_id())
                            .emoji(r.getEmoji() != null ? r.getEmoji() : "❤️")
                            .createdAt(r.getCreated_at())
                            .user(rUserInfo)
                            .build();
                })
                .collect(Collectors.toList());

        return MessageResponse.builder()
                .id(message.getId())
                .fromUserId(message.getFrom_user())
                .toUserId(message.getTo_user())
                .content(message.getContent())
                .isRead(message.getIs_read())
                .createdAt(message.getCreated_at())
                .updatedAt(message.getUpdated_at())
                .fromUser(fromUserInfo)
                .toUser(toUserInfo)
                .media(mediaInfo)
                .reactions(reactionInfo)
                .hasReacted(hasReacted)
                .build();
    }
}

