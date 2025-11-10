import { LIMITS } from "@/constants/limits";

export interface CompressionOptions {
  getProgress?: (progress: number) => void;
  maxSize?: number; // Maximum file size in bytes
}

/**
 * Chuẩn bị video để upload
 * Lưu ý: Với Expo Go, chúng ta không thể nén video trên client
 * Thay vào đó, video sẽ được nén tự động trên Cloudinary server
 * Hàm này chỉ để giữ interface tương thích và mô phỏng progress
 * 
 * @param videoUri URI của video cần upload
 * @param options Tùy chọn
 * @returns URI của video (không thay đổi vì nén trên server)
 */
export const compressVideo = async (
  videoUri: string,
  options: CompressionOptions = {}
): Promise<string> => {
  const { getProgress } = options;

  console.log("Chuẩn bị video để upload:", videoUri);
  console.log("Video sẽ được nén tự động trên Cloudinary server");

  // Mô phỏng progress để UI hiển thị
  // Vì không có nén thực sự, chỉ báo progress nhanh
  if (getProgress) {
    // Simulate progress: 0% -> 100% trong 500ms
    const steps = 10;
    const delay = 50;
    
    for (let i = 0; i <= steps; i++) {
      await new Promise(resolve => setTimeout(resolve, delay));
      getProgress(Math.min(100, (i / steps) * 100));
    }
  }

  // Trả về video URI gốc
  // Cloudinary sẽ tự động nén video khi upload
  return videoUri;
};

/**
 * Kiểm tra xem video có cần nén không
 * Với Expo Go, video sẽ luôn được nén trên server (Cloudinary)
 */
export const shouldCompressVideo = async (videoUri: string): Promise<boolean> => {
  // Video sẽ được nén trên Cloudinary server
  // Không cần nén trên client
  return false;
};

