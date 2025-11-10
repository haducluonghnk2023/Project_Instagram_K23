import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE, API_PREFIX } from "@/constants/config";

// Normalize API_BASE to ensure it has protocol and proper format
let normalizedBase = API_BASE.trim().replace(/\/+$/, ''); // Remove trailing slashes

// If base doesn't start with http:// or https://, add http://
if (!normalizedBase.match(/^https?:\/\//)) {
  normalizedBase = `http://${normalizedBase}`;
}

// Check if it's an IP address or localhost
const ipPattern = /^https?:\/\/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})(?::(\d+))?/;
const localhostPattern = /^https?:\/\/localhost(?::(\d+))?/;

const ipMatch = normalizedBase.match(ipPattern);
const localhostMatch = normalizedBase.match(localhostPattern);

// If it's an IP address or localhost without port, add default port 8080
if (ipMatch || localhostMatch) {
  const match = ipMatch || localhostMatch;
  // If no port is specified (group 2 is undefined), add default port
  if (!match![2]) {
    // Insert port before any path or end of string
    normalizedBase = normalizedBase.replace(/(:\/\/[^\/:]+)(\/|$)/, '$1:8080$2');
  }
}

const cleanPrefix = API_PREFIX.startsWith('/') ? API_PREFIX : '/' + API_PREFIX;
const baseURL = `${normalizedBase}${cleanPrefix.replace(/\/+$/, '')}/`;

export const axiosInstance = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  timeout: 15000,
});

export const setAuthToken = (token: string | null) => {
  if (token) {
    axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete axiosInstance.defaults.headers.common["Authorization"];
  }
};

axiosInstance.interceptors.request.use(
  async (config) => {
    if (!config.headers.Authorization) {
      try {
        const token = await AsyncStorage.getItem("token");
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (error) {
        console.error("Error getting token from storage:", error);
      }
    }
    
    return config;
  },
  (error) => {
    console.error("Request interceptor error:", error);
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    
    // Handle timeout errors
    if (error.code === "ECONNABORTED" || String(error?.message || "").includes("timeout")) {
      return Promise.reject(new Error("Kết nối máy chủ quá thời gian. Vui lòng kiểm tra mạng hoặc thử lại."));
    }
    
    // Handle network errors (no response from server)
    // Axios network errors: ERR_NETWORK, ECONNREFUSED, ENOTFOUND, etc.
    if (!error.response) {
      const isNetworkError = 
        error.code === 'ERR_NETWORK' ||
        error.code === 'ECONNREFUSED' ||
        error.code === 'ENOTFOUND' ||
        error.code === 'ETIMEDOUT' ||
        error.message?.includes('Network Error') ||
        error.message?.includes('network');
      
      if (isNetworkError) {
        return Promise.reject(new Error("Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng."));
      }
      
      // Other errors without response - pass through original error
      return Promise.reject(error);
    }
    
    // Handle 401 Unauthorized
    if (status === 401) {
      // Token expired or invalid - clear it
      try {
        const { invalidateAuth } = await import("@/contexts/AuthContext");
        await invalidateAuth();
      } catch (e) {
        // Fallback: clear token directly
        try {
          await AsyncStorage.removeItem("token");
          setAuthToken(null);
        } catch (err) {
          console.error("Error clearing token:", err);
        }
      }
      // Return a more user-friendly error
      return Promise.reject(new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại."));
    }
    
    return Promise.reject(error);
  }
);