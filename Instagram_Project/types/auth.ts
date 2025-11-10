export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  phone: string; 
  email: string;
  password: string; 
  fullName: string; 
}

export interface ProfileInfo {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  bio: string | null;
  birthday: string | null;
  gender: string | null;
  location: string | null;
  privacySettings: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserInfo {
  id: string;
  phone: string;
  email: string;
  profile: ProfileInfo | null;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: UserInfo;
}
