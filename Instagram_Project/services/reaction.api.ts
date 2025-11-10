import { api } from "./api";

export const toggleReactionApi = async (postId: string): Promise<boolean> => {
  await api.post(`/posts/${postId}/reactions`);
  // After toggle, check the new status
  const checkRes = await api.get<boolean>(`/posts/${postId}/reactions`);
  return checkRes.data;
};

export const checkReactionApi = async (postId: string): Promise<boolean> => {
  const res = await api.get<boolean>(`/posts/${postId}/reactions`);
  return res.data;
};

