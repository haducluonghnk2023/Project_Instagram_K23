import { api, ApiResponse } from "./api";
import { axiosInstance } from "@/utils/axios-instance";

export interface UploadResponse {
  url: string;
}

export const uploadAvatarApi = async (uri: string): Promise<string> => {
  try {
    // Tạo FormData từ file URI
    const formData = new FormData();
    
    // Lấy tên file từ URI
    const filename = uri.split("/").pop() || "avatar.jpg";
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : "image/jpeg";
    
    // @ts-ignore - FormData append với file object
    formData.append("file", {
      uri,
      name: filename,
      type,
    } as any);

    const res = await axiosInstance.post<ApiResponse<UploadResponse>>(
      "/upload/avatar",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    // Backend trả về ResponseWrapper { status, code, data: UploadResponse }
    const uploadData = res.data.data;
    return uploadData.url;
  } catch (error: any) {
    console.error("Upload avatar error:", error);
    throw new Error(error?.response?.data?.data || error?.message || "Không thể upload ảnh");
  }
};

export const uploadImageApi = async (uri: string, folder?: string): Promise<string> => {
  try {
    const formData = new FormData();
    
    const filename = uri.split("/").pop() || "image.jpg";
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : "image/jpeg";
    
    // @ts-ignore
    formData.append("file", {
      uri,
      name: filename,
      type,
    } as any);

    if (folder) {
      // @ts-ignore
      formData.append("folder", folder);
    }

    const res = await axiosInstance.post<ApiResponse<UploadResponse>>(
      "/upload/image",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    const uploadData = res.data.data;
    return uploadData.url;
  } catch (error: any) {
    console.error("Upload image error:", error);
    throw new Error(error?.response?.data?.data || error?.message || "Không thể upload ảnh");
  }
};

export const uploadVideoApi = async (uri: string, folder?: string): Promise<string> => {
  try {
    const formData = new FormData();
    
    const filename = uri.split("/").pop() || "video.mp4";
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `video/${match[1]}` : "video/mp4";
    
    // @ts-ignore
    formData.append("file", {
      uri,
      name: filename,
      type,
    } as any);

    if (folder) {
      // @ts-ignore
      formData.append("folder", folder);
    }

    const res = await axiosInstance.post<ApiResponse<UploadResponse>>(
      "/upload/video",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    const uploadData = res.data.data;
    return uploadData.url;
  } catch (error: any) {
    console.error("Upload video error:", error);
    throw new Error(error?.response?.data?.data || error?.message || "Không thể upload video");
  }
};

