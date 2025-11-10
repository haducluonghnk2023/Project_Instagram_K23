/**
 * Toast utility functions
 * Replaces Alert.alert for better UX
 */

import { useToast } from "@/components/common/ToastProvider";

/**
 * Show success toast
 */
export const showSuccessToast = (message: string) => {
  // This will be used with useToast hook in components
  return { message, type: 'success' as const };
};

/**
 * Show error toast
 */
export const showErrorToast = (message: string) => {
  return { message, type: 'error' as const };
};

/**
 * Show warning toast
 */
export const showWarningToast = (message: string) => {
  return { message, type: 'warning' as const };
};

/**
 * Show info toast
 */
export const showInfoToast = (message: string) => {
  return { message, type: 'info' as const };
};

/**
 * Helper to show toast from error object
 */
export const showErrorFromException = (error: any, defaultMessage: string = 'Đã xảy ra lỗi') => {
  const message = error?.response?.data?.data || 
                  error?.response?.data?.message || 
                  error?.message || 
                  defaultMessage;
  return showErrorToast(message);
};

