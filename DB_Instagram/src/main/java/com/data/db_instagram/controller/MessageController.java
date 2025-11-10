package com.data.db_instagram.controller;

import com.data.db_instagram.dto.request.ReactToMessageRequest;
import com.data.db_instagram.dto.request.SendMessageRequest;
import com.data.db_instagram.dto.response.ConversationInfo;
import com.data.db_instagram.dto.response.MessageResponse;
import com.data.db_instagram.dto.response.ResponseWrapper;
import com.data.db_instagram.security.principal.MyUserDetails;
import com.data.db_instagram.services.MessageService;
import com.data.db_instagram.utils.JwtUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/messages")
@RequiredArgsConstructor
public class MessageController {
    private final MessageService messageService;
    private final JwtUtils jwtUtils;

    @PostMapping
    public ResponseEntity<?> sendMessage(
            @Valid @RequestBody SendMessageRequest request,
            @AuthenticationPrincipal MyUserDetails userDetails
    ) {
        UUID userId = userDetails.getId();
        MessageResponse response = messageService.sendMessage(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ResponseWrapper.builder()
                        .status(HttpStatus.CREATED)
                        .code(HttpStatus.CREATED.value())
                        .data(response)
                        .build());
    }

    @GetMapping("/conversations")
    public ResponseEntity<?> getConversations(
            @AuthenticationPrincipal MyUserDetails userDetails
    ) {
        UUID userId = userDetails.getId();
        List<ConversationInfo> conversations = messageService.getConversations(userId);
        return ResponseEntity.ok(
                ResponseWrapper.builder()
                        .status(HttpStatus.OK)
                        .code(HttpStatus.OK.value())
                        .data(conversations)
                        .build());
    }

    @GetMapping("/conversation/{otherUserId}")
    public ResponseEntity<?> getConversation(
            @PathVariable UUID otherUserId,
            @AuthenticationPrincipal MyUserDetails userDetails
    ) {
        UUID currentUserId = userDetails.getId();
        List<MessageResponse> messages = messageService.getConversation(currentUserId, otherUserId);
        return ResponseEntity.ok(
                ResponseWrapper.builder()
                        .status(HttpStatus.OK)
                        .code(HttpStatus.OK.value())
                        .data(messages)
                        .build());
    }

    @PutMapping("/{messageId}/read")
    public ResponseEntity<?> markAsRead(
            @PathVariable UUID messageId,
            @AuthenticationPrincipal MyUserDetails userDetails
    ) {
        UUID userId = userDetails.getId();
        MessageResponse response = messageService.markAsRead(messageId, userId);
        return ResponseEntity.ok(
                ResponseWrapper.builder()
                        .status(HttpStatus.OK)
                        .code(HttpStatus.OK.value())
                        .data(response)
                        .build());
    }

    @PutMapping("/conversation/{otherUserId}/read-all")
    public ResponseEntity<?> markAllAsRead(
            @PathVariable UUID otherUserId,
            @AuthenticationPrincipal MyUserDetails userDetails
    ) {
        UUID currentUserId = userDetails.getId();
        messageService.markAllAsRead(currentUserId, otherUserId);
        return ResponseEntity.ok(
                ResponseWrapper.builder()
                        .status(HttpStatus.OK)
                        .code(HttpStatus.OK.value())
                        .data("All messages marked as read")
                        .build());
    }

    @PostMapping("/{messageId}/reactions")
    public ResponseEntity<?> reactToMessage(
            @PathVariable UUID messageId,
            @Valid @RequestBody ReactToMessageRequest request,
            @AuthenticationPrincipal MyUserDetails userDetails
    ) {
        UUID userId = userDetails.getId();
        MessageResponse response = messageService.reactToMessage(messageId, request, userId);
        return ResponseEntity.ok(
                ResponseWrapper.builder()
                        .status(HttpStatus.OK)
                        .code(HttpStatus.OK.value())
                        .data(response)
                        .build());
    }

    @DeleteMapping("/{messageId}/reactions")
    public ResponseEntity<?> removeReaction(
            @PathVariable UUID messageId,
            @AuthenticationPrincipal MyUserDetails userDetails
    ) {
        UUID userId = userDetails.getId();
        messageService.removeReaction(messageId, userId);
        return ResponseEntity.ok(
                ResponseWrapper.builder()
                        .status(HttpStatus.OK)
                        .code(HttpStatus.OK.value())
                        .data("Reaction removed")
                        .build());
    }

    @DeleteMapping("/{messageId}")
    public ResponseEntity<?> deleteMessage(
            @PathVariable UUID messageId,
            @AuthenticationPrincipal MyUserDetails userDetails
    ) {
        UUID userId = userDetails.getId();
        messageService.deleteMessage(messageId, userId);
        return ResponseEntity.ok(
                ResponseWrapper.builder()
                        .status(HttpStatus.OK)
                        .code(HttpStatus.OK.value())
                        .data("Message deleted")
                        .build());
    }
}

