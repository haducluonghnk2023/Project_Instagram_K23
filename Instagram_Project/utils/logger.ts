/**
 * Centralized logging utility
 * Replace console.log/error/warn with this for better control
 */

const IS_DEV = __DEV__;

export const logger = {
  log: (...args: any[]) => {
    if (IS_DEV) {
      console.log('[LOG]', ...args);
    }
  },
  error: (...args: any[]) => {
    if (IS_DEV) {
      console.error('[ERROR]', ...args);
    }
    // In production, you could send to error tracking service
  },
  warn: (...args: any[]) => {
    if (IS_DEV) {
      console.warn('[WARN]', ...args);
    }
  },
  info: (...args: any[]) => {
    if (IS_DEV) {
      console.info('[INFO]', ...args);
    }
  },
};

