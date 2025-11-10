package com.data.db_instagram.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MessageReactionInfo {
    private UUID id;
    private UUID userId;
    private String emoji;
    private Date createdAt;
    private UserInfo user;
}

