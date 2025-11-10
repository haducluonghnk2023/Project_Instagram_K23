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
 */
export const isReel = (post: Post): boolean => {
  const hasOnlyVideo = post.media.length > 0 &&
    post.media.every((m) => m.mediaType === 'video') &&
    (!post.content || post.content.trim() === '');
  
  return hasOnlyVideo;
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
 */
export const filterRegularPosts = (posts: Post[]): Post[] => {
  return posts.filter((post) => !isReel(post));
};

