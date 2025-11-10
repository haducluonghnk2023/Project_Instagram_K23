import { UserInfo } from "./auth";

export interface MessageMedia {
  id: string;
  mediaUrl: string;
  mediaType: string; // "image" or "video"
}

export interface MessageReaction {
  id: string;
  userId: string;
  emoji: string;
  createdAt: string;
  user: UserInfo;
}

export interface Message {
  id: string;
  fromUserId: string;
  toUserId: string;
  content: string | null;
  isRead: boolean;
  createdAt: string;
  updatedAt: string | null;
  fromUser: UserInfo;
  toUser: UserInfo;
  media: MessageMedia[];
  reactions: MessageReaction[];
  hasReacted: boolean;
}

export interface Conversation {
  userId: string;
  user: UserInfo;
  lastMessage: Message | null;
  unreadCount: number;
  lastMessageAt: string | null;
}

export interface SendMessageRequest {
  toUserId: string;
  content?: string;
  mediaUrls?: string[];
}

export interface ReactToMessageRequest {
  emoji: string;
}

