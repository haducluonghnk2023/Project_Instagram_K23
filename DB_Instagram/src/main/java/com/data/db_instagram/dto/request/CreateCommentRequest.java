package com.data.db_instagram.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateCommentRequest {
    private String content; // Made optional to allow image-only comments
    
    private UUID parentCommentId; // For threaded comments
    
    private String imageUrl; // Optional image URL for comments with images
}

