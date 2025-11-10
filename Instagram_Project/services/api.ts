import { AxiosRequestConfig } from "axios";
import { axiosInstance, setAuthToken } from "@/utils/axios-instance";

export interface ApiResponse<T> {
  status: string;
  code: number;
  data: T;
}

export { setAuthToken };

async function http<T>(path: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
  const res = await axiosInstance.request<ApiResponse<T>>({
    url: path,
    ...config,
  });
  
  const responseData = res.data;
  
  if (responseData && typeof responseData === 'object' && 'data' in responseData) {
    return responseData as ApiResponse<T>;
  }
  
  return {
    status: 'OK',
    code: 200,
    data: responseData as T,
  };
}

export const api = {
  get: <T>(path: string, config?: AxiosRequestConfig) =>
    http<T>(path, { method: "GET", ...config }),
  post: <T>(path: string, body?: unknown, config?: AxiosRequestConfig) =>
    http<T>(path, { method: "POST", data: body, ...config }),
  put: <T>(path: string, body?: unknown, config?: AxiosRequestConfig) =>
    http<T>(path, { method: "PUT", data: body, ...config }),
  patch: <T>(path: string, body?: unknown, config?: AxiosRequestConfig) =>
    http<T>(path, { method: "PATCH", data: body, ...config }),
  delete: <T>(path: string, config?: AxiosRequestConfig) =>
    http<T>(path, { method: "DELETE", ...config }),
};
