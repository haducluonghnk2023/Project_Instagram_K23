/**
 * Post utility functions
 */

import { Post } from '@/types/post';
import { isWithin24Hours } from './date';

/**
 * Check if post is a story (has video within 24h, not a reel)
 */
export const isStory = (post: Post): boolean => {
  const postDate = new Date(post.createdAt);
  if (!isWithin24Hours(postDate)) return false;
  
  // Must have video
  if (!post.media.some((m) => m.mediaType === 'video')) return false;
  
  // NOT a reel (reels have only video without content)
  const hasOnlyVideo = post.media.length > 0 &&
    post.media.every((m) => m.mediaType === 'video') &&
    (!post.content || post.content.trim() === '');
  
  return !hasOnlyVideo;
};

/**
 * Check if post is a reel (only video without content)
 * Reels are posts that:
 * - Have ONLY video (no images)
 * - Have NO content (empty or null)
 * - This distinguishes reels from regular posts with video
 */
export const isReel = (post: Post): boolean => {
  // Must have at least one media
  if (!post.media || post.media.length === 0) return false;
  
  // Must have ONLY video (no images)
  const hasOnlyVideo = post.media.every((m) => m.mediaType === 'video');
  if (!hasOnlyVideo) return false;
  
  // Must have NO content (empty or null)
  const hasNoContent = !post.content || post.content.trim() === '';
  if (!hasNoContent) return false;
  
  return true;
};

/**
 * Get first video from post media
 */
export const getFirstVideo = (post: Post) => {
  return post.media.find((m) => m.mediaType === 'video');
};

/**
 * Get all images from post media
 */
export const getImages = (post: Post) => {
  return post.media.filter((m) => m.mediaType === 'image');
};

/**
 * Filter stories from posts
 */
export const filterStories = (posts: Post[]): Post[] => {
  return posts.filter(isStory);
};

/**
 * Filter regular posts (exclude reels)
 * 
 * PROBLEM: Backend doesn't distinguish between reels and regular posts.
 * Both /post/create and /reels/create create the same type of post.
 * We can only distinguish based on: video + no content = reel
 * 
 * SOLUTION: Since user wants videos from /post/create to show in home feed,
 * we'll include ALL posts in home feed. The reels screen uses a separate
 * API endpoint (/posts/reels) that only returns posts with video.
 * 
 * Regular posts include:
 * - All posts (text, images, videos, mixed media)
 * - We don't filter out anything because we can't reliably distinguish
 *   between regular video posts and reels
 * 
 * NOTE: If you want to exclude reels from home feed, you would need to
 * add a postType field to the backend or use a different approach.
 */
export const filterRegularPosts = (posts: Post[]): Post[] => {
  // Return all posts - don't filter anything
  // This ensures videos from /post/create are shown in home feed
  // Reels screen uses separate API endpoint /posts/reels
  return posts;
};

