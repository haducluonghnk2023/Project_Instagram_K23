package com.data.db_instagram.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreatePostRequest {
    private String content; // Made optional to allow media-only posts
    
    private String visibility = "public"; // public, private, friends
    
    private String location;
    
    private List<String> mediaUrls; // URLs from Cloudinary upload
    
    private List<String> mediaTypes; // "image" or "video" for each mediaUrl
}

