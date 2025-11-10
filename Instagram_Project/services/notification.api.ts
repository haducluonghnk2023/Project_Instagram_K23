import { api } from "./api";
import { Notification } from "@/types/notification";

export const getNotificationsApi = async (): Promise<Notification[]> => {
  const res = await api.get<Notification[]>("/notifications");
  return res.data;
};

export const getUnreadCountApi = async (): Promise<number> => {
  const res = await api.get<number>("/notifications/unread-count");
  return res.data;
};

export const markNotificationAsReadApi = async (notificationId: string): Promise<void> => {
  await api.put(`/notifications/${notificationId}/read`);
};

export const markAllNotificationsAsReadApi = async (): Promise<void> => {
  await api.put("/notifications/read-all");
};

export const deleteNotificationApi = async (notificationId: string): Promise<void> => {
  await api.delete(`/notifications/${notificationId}`);
};

