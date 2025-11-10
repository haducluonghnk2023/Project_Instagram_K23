import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  savePostApi,
  unsavePostApi,
  checkSavedPostApi,
  getSavedPostsApi,
} from "@/services/savedPost.api";
import { Post } from "@/types/post";

// Helper function để update post trong queries
const updatePostInQueries = (
  queryClient: any,
  postId: string,
  updateFn: (post: Post) => Post
) => {
  // Update tất cả queries có chứa posts
  queryClient.setQueriesData<Post[]>(
    { predicate: (query: any) => {
        // Match tất cả queries có chứa "posts" trong key
        return query.queryKey.some((key: any) => 
          typeof key === 'string' && key.includes('posts')
        );
      }
    },
    (old: Post[] | undefined) => {
      if (!old || !Array.isArray(old)) return old;
      return old.map((post) =>
        post.id === postId ? updateFn(post) : post
      );
    }
  );
  
  // Update single post query
  queryClient.setQueriesData<Post>(
    { queryKey: ["posts", postId] },
    (old: Post | undefined) => {
      if (!old) return old;
      return updateFn(old);
    }
  );
};

export const useSavePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (postId: string) => savePostApi(postId),
    onMutate: async (postId) => {
      // Optimistic update: Đổi icon ngay lập tức
      await queryClient.cancelQueries({ 
        predicate: (query: any) => 
          query.queryKey.some((key: any) => 
            typeof key === 'string' && key.includes('posts')
          )
      });
      
      // Update tất cả posts có postId này
      updatePostInQueries(queryClient, postId, (post) => ({
        ...post,
        isSaved: true,
      }));
    },
    onSuccess: (_, postId) => {
      // Không invalidate posts queries để giữ optimistic update
      // Chỉ invalidate savedPosts để cập nhật danh sách saved
      queryClient.invalidateQueries({ queryKey: ["savedPosts"] });
      
      // Đảm bảo cache vẫn giữ isSaved: true (optimistic update đã set rồi)
      // Không cần invalidate posts queries vì optimistic update đã đúng
    },
    onError: (error: any, postId) => {
      // Kiểm tra nếu lỗi là "already saved", không cần rollback
      const errorMessage = error?.response?.data?.data || error?.message || "";
      if (errorMessage.includes("already saved") || errorMessage.includes("Post already saved")) {
        // Không cần rollback vì trạng thái đã đúng
        return;
      }
      // Rollback nếu có lỗi khác
      updatePostInQueries(queryClient, postId, (post) => ({
        ...post,
        isSaved: false,
      }));
      queryClient.invalidateQueries({ 
        predicate: (query: any) => 
          query.queryKey.some((key: any) => 
            typeof key === 'string' && key.includes('posts')
          )
      });
    },
  });
};

export const useUnsavePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (postId: string) => unsavePostApi(postId),
    onMutate: async (postId) => {
      // Optimistic update: Đổi icon ngay lập tức
      await queryClient.cancelQueries({ 
        predicate: (query: any) => 
          query.queryKey.some((key: any) => 
            typeof key === 'string' && key.includes('posts')
          )
      });
      
      // Update tất cả posts có postId này
      updatePostInQueries(queryClient, postId, (post) => ({
        ...post,
        isSaved: false,
      }));
    },
    onSuccess: (_, postId) => {
      // Không invalidate posts queries để giữ optimistic update
      // Chỉ invalidate savedPosts để cập nhật danh sách saved
      queryClient.invalidateQueries({ queryKey: ["savedPosts"] });
      
      // Đảm bảo cache vẫn giữ isSaved: false (optimistic update đã set rồi)
      // Không cần invalidate posts queries vì optimistic update đã đúng
    },
    onError: (error: any, postId) => {
      // Kiểm tra nếu lỗi là "not found in saved posts", không cần rollback
      const errorMessage = error?.response?.data?.data || error?.message || "";
      if (errorMessage.includes("not found in saved posts") || errorMessage.includes("Post not found in saved posts")) {
        // Không cần rollback vì trạng thái đã đúng
        return;
      }
      // Rollback nếu có lỗi khác
      updatePostInQueries(queryClient, postId, (post) => ({
        ...post,
        isSaved: true,
      }));
      queryClient.invalidateQueries({ 
        predicate: (query: any) => 
          query.queryKey.some((key: any) => 
            typeof key === 'string' && key.includes('posts')
          )
      });
    },
  });
};

export const useCheckSavedPost = (postId: string) => {
  return useQuery<boolean>({
    queryKey: ["savedPost", postId],
    queryFn: () => checkSavedPostApi(postId),
    enabled: !!postId,
  });
};

export const useSavedPosts = () => {
  return useQuery<Post[]>({
    queryKey: ["savedPosts"],
    queryFn: () => getSavedPostsApi(),
  });
};

