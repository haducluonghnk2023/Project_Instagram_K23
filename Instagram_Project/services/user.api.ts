import { api, ApiResponse } from "./api";
import { UserInfo } from "@/types/auth";

export const getMeApi = async (): Promise<UserInfo> => {
  const res = await api.get<UserInfo>("/users/me");
  // api.get trả về ApiResponse<UserInfo> = { status, code, data: UserInfo }
  // Vậy res.data chính là UserInfo
  return res.data;
};

export interface UpdateProfileRequest {
  fullName?: string;
  avatarUrl?: string | null;
  bio?: string | null;
  birthday?: string | null;
  gender?: string | null;
  location?: string | null;
  privacySettings?: string | null;
}

export const getUserByIdApi = async (userId: string): Promise<UserInfo> => {
  const res = await api.get<UserInfo>(`/users/${userId}`);
  return res.data;
};

export const updateMeApi = async (
  body: UpdateProfileRequest
): Promise<UserInfo> => {
  const res = await api.put<UserInfo>("/users/me", body);
  // api.put trả về ApiResponse<UserInfo> = { status, code, data: UserInfo }
  return res.data;
};

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export const changePasswordApi = async (
  body: ChangePasswordRequest
): Promise<string> => {
  const res = await api.put<string>("/users/me/change-password", body);
  // api.put trả về ApiResponse<string> = { status, code, data: string }
  return res.data;
};

