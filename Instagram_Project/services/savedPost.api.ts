import { api } from "./api";
import { Post } from "@/types/post";

export const savePostApi = async (postId: string): Promise<void> => {
  try {
    await api.post(`/posts/saved/${postId}`);
  } catch (error: any) {
    // Nếu bài viết đã được lưu rồi, coi như thành công (idempotent)
    const errorMessage = error?.response?.data?.data || error?.message || "";
    if (errorMessage.includes("already saved") || errorMessage.includes("Post already saved")) {
      return; // Coi như thành công
    }
    throw error; // Ném lại các lỗi khác
  }
};

export const unsavePostApi = async (postId: string): Promise<void> => {
  try {
    await api.delete(`/posts/saved/${postId}`);
  } catch (error: any) {
    // Nếu bài viết chưa được lưu, coi như thành công (idempotent)
    const errorMessage = error?.response?.data?.data || error?.message || "";
    if (errorMessage.includes("not found in saved posts") || errorMessage.includes("Post not found in saved posts")) {
      return; // Coi như thành công
    }
    throw error; // Ném lại các lỗi khác
  }
};

export const checkSavedPostApi = async (postId: string): Promise<boolean> => {
  const res = await api.get<boolean>(`/posts/saved/${postId}/check`);
  return res.data;
};

export const getSavedPostsApi = async (): Promise<Post[]> => {
  const res = await api.get<Post[]>("/posts/saved");
  return res.data;
};

