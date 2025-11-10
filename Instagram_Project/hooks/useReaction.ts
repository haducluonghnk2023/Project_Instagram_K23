import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toggleReactionApi } from "@/services/reaction.api";
import { Post } from "@/types/post";

export const useToggleReaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (postId: string) => toggleReactionApi(postId),
    onSuccess: (response, postId) => {
      // Response có thể chứa thông tin về trạng thái reaction mới
      // Nếu không có, chúng ta sẽ update optimistic và để server sync sau
      
      // Update post trong cache (optimistic update)
      // Không refetch toàn bộ feed để tránh làm mất posts
      queryClient.setQueriesData<Post>(
        { queryKey: ["posts", postId] },
        (old: Post | undefined) => {
          if (old) {
            // Toggle reaction state
            const newHasReacted = !old.hasReacted;
            const newReactionCount = newHasReacted 
              ? (old.reactionCount || 0) + 1 
              : Math.max((old.reactionCount || 0) - 1, 0);
            
            return {
              ...old,
              hasReacted: newHasReacted,
              reactionCount: newReactionCount,
            };
          }
          return old;
        }
      );
      
      // Update post trong feed cache (tất cả feed queries)
      queryClient.setQueriesData<Post[]>(
        { 
          predicate: (query: any) => {
            return query.queryKey[0] === "posts" && 
                   (query.queryKey[1] === "feed" || query.queryKey.length === 1);
          }
        },
        (old: Post[] | undefined) => {
          if (old) {
            return old.map((post) => {
              if (post.id === postId) {
                const newHasReacted = !post.hasReacted;
                const newReactionCount = newHasReacted 
                  ? (post.reactionCount || 0) + 1 
                  : Math.max((post.reactionCount || 0) - 1, 0);
                
                return {
                  ...post,
                  hasReacted: newHasReacted,
                  reactionCount: newReactionCount,
                };
              }
              return post;
            });
          }
          return old;
        }
      );
    },
  });
};

