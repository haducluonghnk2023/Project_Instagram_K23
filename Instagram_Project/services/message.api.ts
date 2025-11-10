import { api } from "./api";
import { Message, Conversation, SendMessageRequest, ReactToMessageRequest } from "@/types/message";

export const sendMessageApi = async (data: SendMessageRequest): Promise<Message> => {
  const res = await api.post<Message>("/messages", data);
  return res.data;
};

export const getConversationsApi = async (): Promise<Conversation[]> => {
  const res = await api.get<Conversation[]>("/messages/conversations");
  return res.data;
};

export const getConversationApi = async (otherUserId: string): Promise<Message[]> => {
  const res = await api.get<Message[]>(`/messages/conversation/${otherUserId}`);
  return res.data;
};

export const markMessageAsReadApi = async (messageId: string): Promise<Message> => {
  const res = await api.put<Message>(`/messages/${messageId}/read`);
  return res.data;
};

export const markAllAsReadApi = async (otherUserId: string): Promise<void> => {
  await api.put(`/messages/conversation/${otherUserId}/read-all`);
};

export const reactToMessageApi = async (
  messageId: string,
  data: ReactToMessageRequest
): Promise<Message> => {
  const res = await api.post<Message>(`/messages/${messageId}/reactions`, data);
  return res.data;
};

export const removeReactionApi = async (messageId: string): Promise<void> => {
  await api.delete(`/messages/${messageId}/reactions`);
};

export const deleteMessageApi = async (messageId: string): Promise<void> => {
  await api.delete(`/messages/${messageId}`);
};

