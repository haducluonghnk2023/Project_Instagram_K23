/**
 * Timing constants
 */

export const TIMING = {
  // Story duration
  STORY_DURATION: 5000, // 5 seconds
  
  // Animation durations
  ANIMATION_FAST: 200,
  ANIMATION_NORMAL: 300,
  ANIMATION_SLOW: 500,
  
  // Debounce/Throttle delays
  SEARCH_DEBOUNCE: 300,
  SCROLL_THROTTLE: 100,
  
  // Cache/Stale times
  CACHE_SHORT: 30 * 1000, // 30 seconds
  CACHE_MEDIUM: 5 * 60 * 1000, // 5 minutes
  CACHE_LONG: 10 * 60 * 1000, // 10 minutes
  
  // Story time window
  STORY_TIME_WINDOW: 24 * 60 * 60 * 1000, // 24 hours
} as const;

