package com.data.db_instagram.services;

import com.data.db_instagram.dto.request.ReactToMessageRequest;
import com.data.db_instagram.dto.request.SendMessageRequest;
import com.data.db_instagram.dto.response.ConversationInfo;
import com.data.db_instagram.dto.response.MessageResponse;

import java.util.List;
import java.util.UUID;

public interface MessageService {
    MessageResponse sendMessage(SendMessageRequest request, UUID fromUserId);
    
    List<MessageResponse> getConversation(UUID currentUserId, UUID otherUserId);
    
    List<ConversationInfo> getConversations(UUID userId);
    
    MessageResponse markAsRead(UUID messageId, UUID userId);
    
    void markAllAsRead(UUID currentUserId, UUID otherUserId);
    
    MessageResponse reactToMessage(UUID messageId, ReactToMessageRequest request, UUID userId);
    
    void removeReaction(UUID messageId, UUID userId);
    
    void deleteMessage(UUID messageId, UUID userId);
}

