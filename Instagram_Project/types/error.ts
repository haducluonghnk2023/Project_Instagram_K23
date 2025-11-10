/**
 * Error types for better type safety
 */

export interface ApiError {
  message: string;
  code?: string;
  statusCode?: number;
  response?: {
    data?: {
      data?: string | Record<string, unknown>;
      message?: string;
      error?: string;
    };
    status?: number;
  };
}

export interface AppError {
  message: string;
  code?: string;
  statusCode?: number;
}

export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof (error as ApiError).response === 'object'
  );
}

export function isAppError(error: unknown): error is AppError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as AppError).message === 'string'
  );
}

