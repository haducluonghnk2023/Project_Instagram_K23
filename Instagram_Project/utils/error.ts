/**
 * Error handling utilities
 */

import { logger } from './logger';
import { ApiError, AppError, isApiError, isAppError } from '@/types/error';

/**
 * Extract error message from API error
 */
export const getErrorMessage = (error: unknown): string => {
  if (typeof error === 'string') return error;
  
  if (isApiError(error)) {
    const data = error.response?.data;
    if (data) {
      if (typeof data === 'string') return data;
      if (data.data) {
        if (typeof data.data === 'string') return data.data;
        if (typeof data.data === 'object' && 'message' in data.data) {
          return String(data.data.message);
        }
      }
      if (data.message) return data.message;
      if (data.error) return data.error;
    }
  }
  
  if (isAppError(error)) {
    return error.message;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'Đã xảy ra lỗi. Vui lòng thử lại.';
};

/**
 * Show error toast (replaced Alert.alert for better UX)
 * Note: This function should be used with useToast hook in components
 * For backward compatibility, we keep the function but it won't show alerts
 */
export const showErrorAlert = (error: unknown, title: string = 'Lỗi'): string => {
  const message = getErrorMessage(error);
  logger.error('Error alert:', error);
  // Return message for useToast hook
  return message;
};

/**
 * Handle API error with logging
 */
export const handleApiError = (error: unknown, context?: string): AppError => {
  const message = getErrorMessage(error);
  const statusCode = isApiError(error) ? error.response?.status : undefined;
  const code = isApiError(error) ? error.code : (error instanceof Error ? error.name : undefined);
  
  logger.error(`API Error${context ? ` in ${context}` : ''}:`, {
    message,
    statusCode,
    error,
  });
  
  return {
    message,
    statusCode,
    code,
  };
};

