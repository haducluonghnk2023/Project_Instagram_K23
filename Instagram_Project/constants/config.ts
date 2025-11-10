import Constants from 'expo-constants';

// Get API configuration from environment variables via app.config.js
export const API_BASE = Constants.expoConfig?.extra?.apiBaseUrl || process.env.API_BASE_URL || "http://localhost:8080";
export const API_PREFIX = Constants.expoConfig?.extra?.apiPrefix || process.env.API_PREFIX || "/api/v1";
export const ENV = Constants.expoConfig?.extra?.env || process.env.NODE_ENV || "development";

export const IS_DEV = ENV === "development";
export const IS_PROD = ENV === "production";