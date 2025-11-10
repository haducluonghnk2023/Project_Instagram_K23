import { api } from "./api";
import { UserInfo } from "@/types/auth";

export interface SearchUserResponse {
  users: UserInfo[];
  total: number;
}

export interface FriendInfo {
  id: string;
  userId: string;
  since: string;
  user: UserInfo;
}

export interface FriendRequestInfo {
  id: string;
  fromUserId: string;
  toUserId: string;
  message: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  fromUser: UserInfo;
  toUser: UserInfo;
}

export interface SendFriendRequestRequest {
  phone: string;
  message?: string;
}

export interface AcceptFriendRequestRequest {
  requestId: string;
}

export interface BlockUserRequest {
  userId: string;
}

// Search users by phone/email
export const searchUsersApi = async (phone: string): Promise<SearchUserResponse> => {
  const res = await api.get<SearchUserResponse>("/friends/search", {
    params: { phone },
  });
  return res.data;
};

// Send friend request
export const sendFriendRequestApi = async (
  body: SendFriendRequestRequest
): Promise<FriendRequestInfo> => {
  const res = await api.post<FriendRequestInfo>("/friends/requests", body);
  return res.data;
};

// Accept friend request
export const acceptFriendRequestApi = async (
  body: AcceptFriendRequestRequest
): Promise<FriendRequestInfo> => {
  const res = await api.post<FriendRequestInfo>("/friends/requests/accept", body);
  return res.data;
};

// Reject friend request
export const rejectFriendRequestApi = async (requestId: string): Promise<void> => {
  await api.post(`/friends/requests/${requestId}/reject`);
};

// Cancel friend request
export const cancelFriendRequestApi = async (requestId: string): Promise<void> => {
  await api.post(`/friends/requests/${requestId}/cancel`);
};

// Get friend requests
export const getFriendRequestsApi = async (): Promise<FriendRequestInfo[]> => {
  const res = await api.get<FriendRequestInfo[]>("/friends/requests");
  return res.data;
};

// Get friends list
export const getFriendsApi = async (): Promise<FriendInfo[]> => {
  const res = await api.get<FriendInfo[]>("/friends");
  return res.data;
};

// Unfriend
export const unfriendApi = async (friendId: string): Promise<void> => {
  await api.delete(`/friends/${friendId}`);
};

// Block user
export const blockUserApi = async (body: BlockUserRequest): Promise<void> => {
  await api.post("/friends/block", body);
};

// Unblock user
export const unblockUserApi = async (blockedUserId: string): Promise<void> => {
  await api.delete(`/friends/block/${blockedUserId}`);
};

// Get blocked users list
export const getBlockedUsersApi = async (): Promise<FriendInfo[]> => {
  const res = await api.get<FriendInfo[]>("/friends/blocked");
  return res.data;
};

// Get friends of a specific user
export const getUserFriendsApi = async (userId: string): Promise<FriendInfo[]> => {
  const res = await api.get<FriendInfo[]>(`/friends/${userId}`);
  return res.data;
};

