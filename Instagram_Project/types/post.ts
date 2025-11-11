import { UserInfo } from "./auth";

export interface PostMedia {
  id: string;
  mediaUrl: string;
  mediaType: string;
  orderIndex: number;
}

export interface Reaction {
  id: string;
  userId: string;
  emoji: string;
  createdAt: string;
  user: UserInfo;
}

export interface Post {
  id: string;
  userId: string;
  content: string;
  visibility: string;
  location: string | null;
  createdAt: string;
  updatedAt: string | null;
  user: UserInfo;
  media: PostMedia[];
  reactionCount: number;
  commentCount: number;
  hasReacted: boolean;
  isSaved?: boolean;
  reactions: Reaction[];
}

export interface CreatePostRequest {
  content?: string;
  visibility?: string;
  location?: string;
  mediaUrls?: string[];
  mediaTypes?: string[]; // "image" or "video" for each mediaUrl
}

export interface UpdatePostRequest {
  content?: string;
  visibility?: string;
  location?: string;
  mediaUrls?: string[];
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  parentCommentId: string | null;
  content: string;
  imageUrl?: string | null;
  createdAt: string;
  updatedAt: string | null;
  user: UserInfo;
  replyCount: number;
  reactionCount: number;
  hasReacted: boolean;
  taggedUserIds?: string[];
}

export interface CreateCommentRequest {
  content: string;
  parentCommentId?: string;
  imageUrl?: string;
  taggedUserIds?: string[];
}

