/**
 * Application limits and constraints
 */

export const LIMITS = {
  // Post limits
  MAX_POST_IMAGES: 10,
  MAX_POST_VIDEOS: 3,
  MAX_POST_CONTENT_LENGTH: 2200,
  
  // Comment limits
  MAX_COMMENT_LENGTH: 1000,
  MAX_COMMENT_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
  
  // Story limits
  MAX_STORY_DURATION: 15 * 1000, // 15 seconds
  MAX_STORY_SIZE: 100 * 1024 * 1024, // 100MB
  
  // Video limits
  MAX_VIDEO_DURATION: 60 * 1000, // 60 seconds (1 minute) for Reels
  MAX_REEL_DURATION: 60 * 1000, // 60 seconds for Reels
  MAX_POST_VIDEO_DURATION: 300 * 1000, // 5 minutes for regular posts
  
  // User limits
  MAX_USERNAME_LENGTH: 30,
  MAX_BIO_LENGTH: 150,
  MAX_FULLNAME_LENGTH: 50,
  
  // Feed limits
  FEED_PAGE_SIZE: 10,
  FEED_MAX_PAGES: 100,
  
  // Story display limits
  MAX_STORIES_DISPLAY: 10,
  
  // File upload limits
  MAX_IMAGE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_VIDEO_SIZE: 50 * 1024 * 1024, // 50MB (matches backend)
} as const;

