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
public class FriendRequestInfo {
    private UUID id;
    private UUID fromUserId;
    private UUID toUserId;
    private String message;
    private String status;
    private Date createdAt;
    private Date updatedAt;
    private UserInfo fromUser;
    private UserInfo toUser;
}

