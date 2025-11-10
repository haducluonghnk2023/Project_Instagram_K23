package com.data.db_instagram.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdatePostRequest {
    private String content;
    private String visibility; // public, private, friends
    private String location;
    private List<String> mediaUrls;
    private List<String> mediaTypes; // "image" or "video" for each mediaUrl
}

