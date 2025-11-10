import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createPostApi,
  updatePostApi,
  deletePostApi,
  getPostByIdApi,
  getFeedApi,
  getUserPostsApi,
  getReelsApi,
} from "@/services/post.api";
import { Post, CreatePostRequest, UpdatePostRequest } from "@/types/post";

export const useCreatePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePostRequest) => createPostApi(data),
    onSuccess: (newPost) => {
      // Invalidate tất cả feed queries (với pattern matching)
      queryClient.invalidateQueries({ 
        predicate: (query: any) => {
          return query.queryKey[0] === "posts" && 
                 (query.queryKey[1] === "feed" || query.queryKey.length === 1);
        }
      });
      
      // Invalidate user posts để cập nhật profile
      queryClient.invalidateQueries({ 
        predicate: (query: any) => {
          return query.queryKey[0] === "posts" && query.queryKey[1] === "user";
        }
      });
      
      // Thêm post mới vào đầu feed cache (optimistic update)
      queryClient.setQueriesData<Post[]>(
        { 
          predicate: (query: any) => {
            return query.queryKey[0] === "posts" && query.queryKey[1] === "feed";
          }
        },
        (old: Post[] | undefined) => {
          if (old) {
            // Kiểm tra xem post đã có chưa để tránh duplicate
            const exists = old.some(p => p.id === newPost.id);
            if (!exists) {
              return [newPost, ...old];
            }
            return old;
          }
          // Nếu chưa có cache, tạo mới với post mới
          return [newPost];
        }
      );
    },
  });
};

export const useUpdatePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, data }: { postId: string; data: UpdatePostRequest }) =>
      updatePostApi(postId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["posts", variables.postId] });
      queryClient.invalidateQueries({ queryKey: ["posts", "feed"] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
};

export const useDeletePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (postId: string) => deletePostApi(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts", "feed"] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["posts", "user"] });
      queryClient.invalidateQueries({ queryKey: ["posts", "reels"] });
    },
  });
};

export const usePost = (postId: string) => {
  return useQuery<Post>({
    queryKey: ["posts", postId],
    queryFn: () => getPostByIdApi(postId),
    enabled: !!postId,
  });
};

export const useFeed = (page: number = 0, size: number = 10) => {
  return useQuery<Post[]>({
    queryKey: ["posts", "feed", page, size],
    queryFn: () => getFeedApi(page, size),
    staleTime: 30 * 1000, // 30 seconds
    keepPreviousData: true, // Keep previous data while loading new page
  });
};

export const useUserPosts = (
  userId: string,
  page: number = 0,
  size: number = 10,
  options?: { enabled?: boolean }
) => {
  return useQuery<Post[]>({
    queryKey: ["posts", "user", userId, page, size],
    queryFn: () => getUserPostsApi(userId, page, size),
    enabled: (options?.enabled !== false) && !!userId,
    keepPreviousData: true, // Keep previous data while loading new page
  });
};

export const useReels = (page: number = 0, size: number = 10) => {
  return useQuery<Post[]>({
    queryKey: ["posts", "reels", page, size],
    queryFn: () => getReelsApi(page, size),
    staleTime: 30 * 1000, // 30 seconds
    keepPreviousData: true, // Keep previous data while loading new page
  });
};

