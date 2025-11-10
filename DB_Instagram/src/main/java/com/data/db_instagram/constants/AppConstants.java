package com.data.db_instagram.constants;

/**
 * Application-wide constants
 */
public final class AppConstants {
    
    private AppConstants() {
        // Utility class - prevent instantiation
    }
    
    // File Upload Limits
    public static final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    public static final long MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB
    public static final long MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
    
    // Allowed File Types
    public static final String[] ALLOWED_IMAGE_TYPES = {
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp"
    };
    
    public static final String[] ALLOWED_VIDEO_TYPES = {
        "video/mp4",
        "video/mpeg",
        "video/quicktime",
        "video/x-msvideo"
    };
    
    // Friend Request Status
    public static final String FRIEND_REQUEST_STATUS_PENDING = "pending";
    public static final String FRIEND_REQUEST_STATUS_ACCEPTED = "accepted";
    public static final String FRIEND_REQUEST_STATUS_REJECTED = "rejected";
    public static final String FRIEND_REQUEST_STATUS_CANCELLED = "cancelled";
    
    // Post Visibility
    public static final String POST_VISIBILITY_PUBLIC = "public";
    public static final String POST_VISIBILITY_PRIVATE = "private";
    public static final String POST_VISIBILITY_FRIENDS = "friends";
    
    // Pagination
    public static final int DEFAULT_PAGE_SIZE = 10;
    public static final int MAX_PAGE_SIZE = 100;
    
    // Story Time Window (24 hours in milliseconds)
    public static final long STORY_TIME_WINDOW_MS = 24 * 60 * 60 * 1000L;
    
    // Cloudinary Folders
    public static final String CLOUDINARY_FOLDER_INSTAGRAM = "instagram";
    public static final String CLOUDINARY_FOLDER_POSTS = "instagram/posts";
    public static final String CLOUDINARY_FOLDER_AVATARS = "instagram/avatars";
    public static final String CLOUDINARY_FOLDER_MESSAGES = "instagram/messages";
    
    // Media Types
    public static final String MEDIA_TYPE_IMAGE = "image";
    public static final String MEDIA_TYPE_VIDEO = "video";
    
    // Reaction Emojis
    public static final String REACTION_LIKE = "❤️";
    public static final String REACTION_LOVE = "😍";
    public static final String REACTION_LAUGH = "😂";
    public static final String REACTION_WOW = "😮";
    public static final String REACTION_SAD = "😢";
    public static final String REACTION_ANGRY = "😡";
}

