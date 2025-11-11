import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createCommentApi,
  getPostCommentsApi,
  deleteCommentApi,
  getCommentRepliesApi,
} from "@/services/comment.api";
import { Comment, CreateCommentRequest, Post } from "@/types/post";

export const useCreateComment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      postId,
      data,
    }: {
      postId: string;
      data: CreateCommentRequest;
    }) => createCommentApi(postId, data),
    onSuccess: (_, variables) => {
      // Invalidate comments để refetch danh sách comments
      queryClient.invalidateQueries({
        queryKey: ["comments", variables.postId],
      });
      // If replying to a comment, invalidate that comment's replies
      if (variables.data.parentCommentId) {
        queryClient.invalidateQueries({
          queryKey: ["commentReplies", variables.postId, variables.data.parentCommentId],
        });
      }
      
      // Update post trong cache để tăng comment count (optimistic update)
      // Không refetch toàn bộ feed để tránh làm mất posts
      queryClient.setQueriesData<Post>(
        { queryKey: ["posts", variables.postId] },
        (old: Post | undefined) => {
          if (old) {
            return {
              ...old,
              commentCount: (old.commentCount || 0) + 1,
            };
          }
          return old;
        }
      );
      
      // Update post trong feed cache (tất cả feed queries)
      queryClient.setQueriesData<Post[]>(
        { 
          predicate: (query: any) => {
            return query.queryKey[0] === "posts" && query.queryKey[1] === "feed";
          }
        },
        (old: Post[] | undefined) => {
          if (old) {
            return old.map((post) =>
              post.id === variables.postId
                ? { ...post, commentCount: (post.commentCount || 0) + 1 }
                : post
            );
          }
          return old;
        }
      );
    },
  });
};

export const usePostComments = (postId: string) => {
  return useQuery<Comment[]>({
    queryKey: ["comments", postId],
    queryFn: () => getPostCommentsApi(postId),
    enabled: !!postId,
  });
};

export const useDeleteComment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      postId,
      commentId,
      replyCount = 0, // Số lượng replies của comment này
    }: {
      postId: string;
      commentId: string;
      replyCount?: number; // Thêm replyCount để tính đúng số lượng comments bị xóa
    }) => deleteCommentApi(postId, commentId),
    onSuccess: (_, variables) => {
      // Invalidate comments để refetch danh sách comments
      queryClient.invalidateQueries({
        queryKey: ["comments", variables.postId],
      });
      
      // Invalidate tất cả comment replies queries của comment này
      queryClient.invalidateQueries({
        queryKey: ["commentReplies", variables.postId, variables.commentId],
      });
      
      // Tính số lượng comments bị xóa = 1 (comment chính) + replyCount (số replies)
      const deletedCount = 1 + (variables.replyCount || 0);
      
      // Update post trong cache để giảm comment count đúng số lượng
      queryClient.setQueriesData<Post>(
        { queryKey: ["posts", variables.postId] },
        (old: Post | undefined) => {
          if (old) {
            return {
              ...old,
              commentCount: Math.max((old.commentCount || 0) - deletedCount, 0),
            };
          }
          return old;
        }
      );
      
      // Update post trong feed cache (tất cả feed queries)
      queryClient.setQueriesData<Post[]>(
        { 
          predicate: (query: any) => {
            return query.queryKey[0] === "posts" && query.queryKey[1] === "feed";
          }
        },
        (old: Post[] | undefined) => {
          if (old) {
            return old.map((post) =>
              post.id === variables.postId
                ? { ...post, commentCount: Math.max((post.commentCount || 0) - deletedCount, 0) }
                : post
            );
          }
          return old;
        }
      );
    },
  });
};

export const useCommentReplies = (postId: string, commentId: string) => {
  return useQuery<Comment[]>({
    queryKey: ["commentReplies", postId, commentId],
    queryFn: () => getCommentRepliesApi(postId, commentId),
    enabled: !!postId && !!commentId,
  });
};

