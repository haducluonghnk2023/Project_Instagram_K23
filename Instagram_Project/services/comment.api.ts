import { api, ApiResponse } from "./api";
import { Comment, CreateCommentRequest } from "@/types/post";

export const createCommentApi = async (
  postId: string,
  data: CreateCommentRequest
): Promise<Comment> => {
  const res = await api.post<Comment>(`/posts/${postId}/comments`, data);
  return res.data;
};

export const getPostCommentsApi = async (
  postId: string
): Promise<Comment[]> => {
  const res = await api.get<Comment[]>(`/posts/${postId}/comments`);
  return res.data;
};

export const deleteCommentApi = async (
  postId: string,
  commentId: string
): Promise<void> => {
  await api.delete(`/posts/${postId}/comments/${commentId}`);
};

export const getCommentRepliesApi = async (
  postId: string,
  commentId: string
): Promise<Comment[]> => {
  const res = await api.get<Comment[]>(`/posts/${postId}/comments/${commentId}/replies`);
  return res.data;
};

