import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { setAuthToken } from "@/services/api";
import { isTokenExpired } from "@/utils/jwt";

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
  login: (token: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  invalidateAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

let invalidateAuthRef: (() => Promise<void>) | null = null;

export const invalidateAuth = async () => {
  if (invalidateAuthRef) {
    await invalidateAuthRef();
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  const checkAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem("token");
      if (storedToken) {
        // Check if token is expired
        if (isTokenExpired(storedToken)) {
          // Token expired, clear it
          console.log("Token expired, clearing...");
          await AsyncStorage.removeItem("token");
          setToken(null);
          setAuthToken(null);
          setIsAuthenticated(false);
        } else {
          setToken(storedToken);
          setAuthToken(storedToken);
          setIsAuthenticated(true);
        }
      } else {
        setToken(null);
        setAuthToken(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error("Error checking auth:", error);
      setToken(null);
      setAuthToken(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (newToken: string) => {
    try {
      await AsyncStorage.setItem("token", newToken);
      setToken(newToken);
      setAuthToken(newToken);
      setIsAuthenticated(true);
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem("token");
      setAuthToken(null);
      setToken(null);
      setIsAuthenticated(false);
    } catch (error) {
      // Đảm bảo state được update ngay cả khi có lỗi
      setAuthToken(null);
      setToken(null);
      setIsAuthenticated(false);
      throw error;
    }
  };

  const invalidateAuth = async () => {
    try {
      await AsyncStorage.removeItem("token");
      setToken(null);
      setAuthToken(null);
      setIsAuthenticated(false);
    } catch (error) {}
  };

  useEffect(() => {
    checkAuth();
    invalidateAuthRef = invalidateAuth;
    return () => {
      invalidateAuthRef = null;
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        token,
        login,
        logout,
        checkAuth,
        invalidateAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
};
