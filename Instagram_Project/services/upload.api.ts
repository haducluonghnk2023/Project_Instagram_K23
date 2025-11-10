import { api, ApiResponse } from "./api";
import { uploadAxiosInstance } from "@/utils/axios-instance";
import { FormDataFile } from "@/types/upload";

export interface UploadResponse {
  url: string;
}

// Helper function to normalize MIME type
const normalizeMimeType = (extension: string, defaultType: string): string => {
  const ext = extension.toLowerCase();
  
  // Normalize image extensions
  if (defaultType === 'image') {
    if (ext === 'jpg' || ext === 'jpeg') {
      return 'image/jpeg';
    }
    if (ext === 'png') {
      return 'image/png';
    }
    if (ext === 'gif') {
      return 'image/gif';
    }
    if (ext === 'webp') {
      return 'image/webp';
    }
    // Default to jpeg for unknown image extensions
    return 'image/jpeg';
  }
  
  // Normalize video extensions
  if (defaultType === 'video') {
    if (ext === 'mp4') {
      return 'video/mp4';
    }
    if (ext === 'mov') {
      return 'video/quicktime';
    }
    if (ext === 'avi') {
      return 'video/x-msvideo';
    }
    if (ext === 'mpeg' || ext === 'mpg') {
      return 'video/mpeg';
    }
    // Default to mp4 for unknown video extensions
    return 'video/mp4';
  }
  
  return `${defaultType}/${ext}`;
};

// Helper function to create FormData from file URI
const createFormData = (uri: string, defaultName: string, defaultType: string): FormData => {
  const formData = new FormData();
  const filename = uri.split("/").pop() || defaultName;
  const match = /\.(\w+)$/.exec(filename);
  
  // Normalize MIME type (jpg -> jpeg, etc.)
  let type: string;
  if (match) {
    type = normalizeMimeType(match[1], defaultType);
  } else {
    // Nếu không có extension, dùng default type dựa trên defaultType
    // Expo Image Picker có thể trả về file không có extension
    type = defaultType === 'image' ? 'image/jpeg' : 'video/mp4';
  }
  
  // Đảm bảo filename có extension hợp lệ
  let finalFilename = filename;
  if (!match && defaultType === 'image') {
    finalFilename = filename.includes('.') ? filename : `${filename}.jpg`;
  } else if (!match && defaultType === 'video') {
    finalFilename = filename.includes('.') ? filename : `${filename}.mp4`;
  }
  
  const fileData: FormDataFile = {
    uri,
    name: finalFilename,
    type,
  };
  
  formData.append("file", fileData as unknown as string | Blob);
  return formData;
};

export const uploadAvatarApi = async (uri: string): Promise<string> => {
  const formData = createFormData(uri, "avatar.jpg", "image");
  
  try {
    const res = await uploadAxiosInstance.post<ApiResponse<UploadResponse>>(
      "/upload/avatar",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    // Handle response structure
    const responseData = res.data;
    
    if (responseData?.data?.url) {
      return responseData.data.url;
    }
    
    if (responseData?.url) {
      return responseData.url;
    }
    
    if (responseData?.data?.data?.url) {
      return responseData.data.data.url;
    }
    
    console.error("Unexpected response structure:", JSON.stringify(responseData, null, 2));
    throw new Error("Không nhận được URL từ server. Cấu trúc response không đúng.");
  } catch (error: unknown) {
    console.error("Upload avatar error:", error);
    throw error;
  }
};

export const uploadImageApi = async (uri: string, folder?: string): Promise<string> => {
  const formData = createFormData(uri, "image.jpg", "image");
  
  if (folder) {
    formData.append("folder", folder);
  }

  try {
    const res = await uploadAxiosInstance.post<ApiResponse<UploadResponse>>(
      "/upload/image",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    // Handle response structure: res.data = ApiResponse<UploadResponse>
    // ApiResponse = { status, code, data: UploadResponse }
    // UploadResponse = { url: string }
    // Backend trả về: ResponseWrapper { status, code, data: UploadResponse { url } }
    
    const responseData = res.data;
    
    // Case 1: Standard structure - res.data.data.url
    if (responseData?.data?.url) {
      return responseData.data.url;
    }
    
    // Case 2: Direct URL in data
    if (responseData?.url) {
      return responseData.url;
    }
    
    // Case 3: Nested structure
    if (responseData?.data?.data?.url) {
      return responseData.data.data.url;
    }
    
    // Log for debugging
    console.error("Unexpected response structure:", JSON.stringify(responseData, null, 2));
    throw new Error("Không nhận được URL từ server. Cấu trúc response không đúng.");
  } catch (error: unknown) {
    console.error("Upload image error:", error);
    // Re-throw để caller xử lý
    throw error;
  }
};

export const uploadVideoApi = async (uri: string, folder?: string): Promise<string> => {
  const formData = createFormData(uri, "video.mp4", "video");
  
  if (folder) {
    formData.append("folder", folder);
  }

  try {
    const res = await uploadAxiosInstance.post<ApiResponse<UploadResponse>>(
      "/upload/video",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    // Handle response structure
    const responseData = res.data;
    
    if (responseData?.data?.url) {
      return responseData.data.url;
    }
    
    if (responseData?.url) {
      return responseData.url;
    }
    
    if (responseData?.data?.data?.url) {
      return responseData.data.data.url;
    }
    
    console.error("Unexpected response structure:", JSON.stringify(responseData, null, 2));
    throw new Error("Không nhận được URL từ server. Cấu trúc response không đúng.");
  } catch (error: unknown) {
    console.error("Upload video error:", error);
    throw error;
  }
};

