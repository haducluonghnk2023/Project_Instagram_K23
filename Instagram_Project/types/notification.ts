import { UserInfo } from "./auth";

export interface Notification {
  id: string;
  userId: string;
  actorId: string;
  type: string; // "message_new", "friend_request", "friend_accept", etc.
  payload: string; // JSON string
  isRead: boolean;
  createdAt: string;
  actor: UserInfo | null;
}

