/**
 * Date utility functions
 */

/**
 * Get time ago string (e.g., "2 giờ", "5 phút")
 */
export const getTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "vừa xong";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ`;
  return `${Math.floor(diffInSeconds / 86400)} ngày`;
};

/**
 * Check if date is within last 24 hours
 */
export const isWithin24Hours = (date: Date): boolean => {
  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  return date >= twentyFourHoursAgo;
};

/**
 * Format date to string
 */
export const formatDate = (date: Date, format: 'short' | 'long' = 'short'): string => {
  if (format === 'short') {
    return date.toLocaleDateString('vi-VN');
  }
  return date.toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

/**
 * Format birthday from ISO string to YYYY-MM-DD format
 * Handles both ISO format (2005-10-06T00:00:00) and YYYY-MM-DD format
 */
export const formatBirthday = (birthday: string | null | undefined): string => {
  if (!birthday) return "";
  
  // If already in YYYY-MM-DD format, return as is
  if (/^\d{4}-\d{2}-\d{2}$/.test(birthday)) {
    return birthday;
  }
  
  // If in ISO format (2005-10-06T00:00:00 or 2005-10-06T00:00:00.000Z), extract date part
  const dateMatch = birthday.match(/^(\d{4}-\d{2}-\d{2})/);
  if (dateMatch) {
    return dateMatch[1];
  }
  
  // Try to parse as Date and format
  try {
    const date = new Date(birthday);
    if (!isNaN(date.getTime())) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  } catch (e) {
    // If parsing fails, return empty string
  }
  
  return "";
};

