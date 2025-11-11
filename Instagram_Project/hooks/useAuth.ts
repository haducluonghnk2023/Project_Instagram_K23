import { loginApi, registerApi } from "@/services/auth.api";
import { getMeApi, getUserByIdApi, updateMeApi, UpdateProfileRequest, changePasswordApi, ChangePasswordRequest } from "@/services/user.api";
import { LoginRequest, RegisterRequest, UserInfo } from "@/types/auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthContext } from "@/contexts/AuthContext";

export const useLogin = () => {
  return useMutation({
    mutationFn: (data: LoginRequest) => loginApi(data),
  });
};

export const useRegister = () => {
  return useMutation({
    mutationFn: (data: RegisterRequest) => registerApi(data),
  });
};


export const useMe = () => {
  const { isAuthenticated, token, invalidateAuth } = useAuthContext();
  
  return useQuery<UserInfo>({
    queryKey: ["me"],
    queryFn: async () => {
      try {
        const result = await getMeApi();
        return result;
      } catch (error: any) {
        // Log error nhưng không hiển thị console.error để tránh spam
        // Component sẽ xử lý hiển thị toast notification
        const isUnauthorized = 
          error?.response?.status === 401 || 
          error?.message?.includes("Phiên đăng nhập đã hết hạn");
        
        if (!isUnauthorized) {
          // Chỉ log các lỗi khác, không log lỗi authentication vì sẽ hiển thị toast
          console.error("Error fetching user info:", {
            message: error?.message,
            code: error?.code,
            response: error?.response ? {
              status: error.response.status,
              data: error.response.data
            } : null
          });
        }
        throw error;
      }
    },
    enabled: isAuthenticated && !!token,
    retry: (failureCount, error: any) => {
      // Don't retry on 401 (unauthorized)
      if (error?.response?.status === 401 || error?.message?.includes("Phiên đăng nhập đã hết hạn")) {
        invalidateAuth();
        return false;
      }
      // Don't retry on network errors (they're usually persistent)
      if (!error?.response && (error?.code === 'ERR_NETWORK' || error?.code === 'ECONNREFUSED')) {
        return false;
      }
      // Retry up to 2 times for other errors
      return failureCount < 2;
    },
    retryDelay: 1000,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });
};

export const useUser = (userId: string, options?: { enabled?: boolean }) => {
  return useQuery<UserInfo>({
    queryKey: ["user", userId],
    queryFn: () => getUserByIdApi(userId),
    enabled: (options?.enabled !== false) && !!userId,
  });
};

export const useUpdateMe = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (body: UpdateProfileRequest) => updateMeApi(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me"] });
    },
  });
};

export const useChangePassword = () => {
  return useMutation({
    mutationFn: (body: ChangePasswordRequest) => changePasswordApi(body),
  });
};