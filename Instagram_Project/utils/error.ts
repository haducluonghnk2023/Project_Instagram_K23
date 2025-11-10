/**
 * Error handling utilities
 */

import { logger } from './logger';

export interface AppError {
  message: string;
  code?: string;
  statusCode?: number;
}

/**
 * Extract error message from API error
 */
export const getErrorMessage = (error: any): string => {
  if (typeof error === 'string') return error;
  
  if (error?.response?.data) {
    const data = error.response.data;
    if (typeof data === 'string') return data;
    if (data?.data) {
      if (typeof data.data === 'string') return data.data;
      if (data.data?.message) return data.data.message;
    }
    if (data?.message) return data.message;
    if (data?.error) return data.error;
  }
  
  if (error?.message) return error.message;
  
  return 'Đã xảy ra lỗi. Vui lòng thử lại.';
};

/**
 * Show error toast (replaced Alert.alert for better UX)
 * Note: This function should be used with useToast hook in components
 * For backward compatibility, we keep the function but it won't show alerts
 */
export const showErrorAlert = (error: any, title: string = 'Lỗi') => {
  const message = getErrorMessage(error);
  logger.error('Error alert:', error);
  // Return message for useToast hook
  return message;
};

/**
 * Handle API error with logging
 */
export const handleApiError = (error: any, context?: string): AppError => {
  const message = getErrorMessage(error);
  const statusCode = error?.response?.status;
  
  logger.error(`API Error${context ? ` in ${context}` : ''}:`, {
    message,
    statusCode,
    error,
  });
  
  return {
    message,
    statusCode,
    code: error?.code,
  };
};

