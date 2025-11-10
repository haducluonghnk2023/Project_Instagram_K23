import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  sendMessageApi,
  getConversationsApi,
  getConversationApi,
  markMessageAsReadApi,
  markAllAsReadApi,
  deleteMessageApi,
} from "@/services/message.api";
import { Message, Conversation, SendMessageRequest } from "@/types/message";

export const useSendMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SendMessageRequest) => sendMessageApi(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["messages", "conversations"] });
      queryClient.invalidateQueries({ queryKey: ["messages", "conversation", variables.toUserId] });
    },
  });
};

export const useConversations = () => {
  return useQuery<Conversation[]>({
    queryKey: ["messages", "conversations"],
    queryFn: () => getConversationsApi(),
    staleTime: 10 * 1000, // 10 seconds
  });
};

export const useConversation = (otherUserId: string) => {
  return useQuery<Message[]>({
    queryKey: ["messages", "conversation", otherUserId],
    queryFn: () => getConversationApi(otherUserId),
    enabled: !!otherUserId,
    staleTime: 5 * 1000, // 5 seconds
  });
};

export const useMarkAsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (messageId: string) => markMessageAsReadApi(messageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", "conversations"] });
      queryClient.invalidateQueries({ queryKey: ["messages", "conversation"] });
    },
  });
};

export const useMarkAllAsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (otherUserId: string) => markAllAsReadApi(otherUserId),
    onSuccess: (_, otherUserId) => {
      queryClient.invalidateQueries({ queryKey: ["messages", "conversations"] });
      queryClient.invalidateQueries({ queryKey: ["messages", "conversation", otherUserId] });
    },
  });
};

export const useDeleteMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (messageId: string) => deleteMessageApi(messageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", "conversations"] });
      queryClient.invalidateQueries({ queryKey: ["messages", "conversation"] });
    },
  });
};

