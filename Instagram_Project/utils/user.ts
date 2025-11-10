/**
 * User utility functions
 */

import { UserInfo } from '@/types/auth';
import { getUsernameFromEmail, truncateText } from './validation';

/**
 * Get display name from user info
 */
export const getUserDisplayName = (user: UserInfo | null | undefined): string => {
  if (!user) return 'User';
  return user.profile?.fullName || getUsernameFromEmail(user.email || '') || 'User';
};

/**
 * Get username from user info
 */
export const getUsername = (user: UserInfo | null | undefined): string => {
  if (!user) return 'user';
  return getUsernameFromEmail(user.email || '') || 'user';
};

/**
 * Get avatar URL from user info
 */
export const getAvatarUrl = (user: UserInfo | null | undefined): string | null => {
  return user?.profile?.avatarUrl || null;
};

/**
 * Format username for display (truncate if too long)
 */
export const formatUsername = (username: string, maxLength: number = 12): string => {
  if (username.length <= maxLength) return username;
  return truncateText(username, maxLength);
};

