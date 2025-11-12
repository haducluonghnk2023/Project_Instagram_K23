import Constants from 'expo-constants';
export const API_BASE = Constants.expoConfig?.extra?.apiBaseUrl || "http://localhost:8080";
export const API_PREFIX = Constants.expoConfig?.extra?.apiPrefix || "/api/v1";