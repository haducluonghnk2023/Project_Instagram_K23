import { AuthResponse, LoginRequest, RegisterRequest } from "@/types/auth";
import { api } from "./api";

export const loginApi = async (data: LoginRequest): Promise<AuthResponse> => {
  const res = await api.post<AuthResponse>("/auth/login", data);
  return res.data;
};

export const registerApi = async (data: RegisterRequest): Promise<AuthResponse> => {
  const res = await api.post<AuthResponse>("/auth/register", data);
  return res.data;
};
