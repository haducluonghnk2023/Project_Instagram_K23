import { useMutation, useQueryClient } from "@tanstack/react-query";
import { reactToMessageApi, removeReactionApi } from "@/services/message.api";
import { ReactToMessageRequest } from "@/types/message";

export const useReactToMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ messageId, data }: { messageId: string; data: ReactToMessageRequest }) =>
      reactToMessageApi(messageId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", "conversation"] });
      queryClient.invalidateQueries({ queryKey: ["messages", "conversations"] });
    },
  });
};

export const useRemoveReaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (messageId: string) => removeReactionApi(messageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", "conversation"] });
      queryClient.invalidateQueries({ queryKey: ["messages", "conversations"] });
    },
  });
};

