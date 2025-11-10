package com.data.db_instagram.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SendMessageRequest {
    @NotNull(message = "To user ID is required")
    private UUID toUserId;
    
    private String content;
    
    private List<String> mediaUrls; // URLs from Cloudinary upload (for images/videos)
}

