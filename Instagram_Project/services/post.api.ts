import { api, ApiResponse } from "./api";
import { Post, CreatePostRequest, UpdatePostRequest } from "@/types/post";

export const createPostApi = async (data: CreatePostRequest): Promise<Post> => {
  const res = await api.post<Post>("/posts", data);
  return res.data;
};

export const updatePostApi = async (
  postId: string,
  data: UpdatePostRequest
): Promise<Post> => {
  const res = await api.put<Post>(`/posts/${postId}`, data);
  return res.data;
};

export const deletePostApi = async (postId: string): Promise<void> => {
  await api.delete(`/posts/${postId}`);
};

export const getPostByIdApi = async (postId: string): Promise<Post> => {
  const res = await api.get<Post>(`/posts/${postId}`);
  return res.data;
};

export const getFeedApi = async (
  page: number = 0,
  size: number = 10
): Promise<Post[]> => {
  const res = await api.get<Post[]>(`/posts/feed?page=${page}&size=${size}`);
  return res.data;
};

export const getUserPostsApi = async (
  userId: string,
  page: number = 0,
  size: number = 10
): Promise<Post[]> => {
  const res = await api.get<Post[]>(`/posts/user/${userId}?page=${page}&size=${size}`);
  return res.data;
};

export const getReelsApi = async (
  page: number = 0,
  size: number = 10
): Promise<Post[]> => {
  const res = await api.get<Post[]>(`/posts/reels?page=${page}&size=${size}`);
  return res.data;
};

