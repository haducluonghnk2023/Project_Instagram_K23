import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { 
  getFriendsApi, 
  getBlockedUsersApi, 
  getUserFriendsApi, 
  getFriendRequestsApi,
  sendFriendRequestApi,
  unfriendApi,
  FriendInfo,
  FriendRequestInfo,
  SendFriendRequestRequest
} from "@/services/friend.api";
import { useAuthContext } from "@/contexts/AuthContext";

export const useFriends = () => {
  const { isAuthenticated } = useAuthContext();
  
  return useQuery<FriendInfo[]>({
    queryKey: ["friends"],
    queryFn: () => getFriendsApi(),
    enabled: isAuthenticated,
    staleTime: 30 * 1000, // 30 seconds
  });
};

export const useUserFriends = (userId: string, options?: { enabled?: boolean }) => {
  const { isAuthenticated } = useAuthContext();
  
  return useQuery<FriendInfo[]>({
    queryKey: ["friends", userId],
    queryFn: () => getUserFriendsApi(userId),
    enabled: (options?.enabled !== false) && isAuthenticated && !!userId,
    staleTime: 30 * 1000, // 30 seconds
  });
};

export const useBlockedUsers = () => {
  const { isAuthenticated } = useAuthContext();
  
  return useQuery<FriendInfo[]>({
    queryKey: ["blockedUsers"],
    queryFn: () => getBlockedUsersApi(),
    enabled: isAuthenticated,
    staleTime: 30 * 1000, // 30 seconds
  });
};

export const useFriendRequests = () => {
  const { isAuthenticated } = useAuthContext();
  
  return useQuery<FriendRequestInfo[]>({
    queryKey: ["friendRequests"],
    queryFn: () => getFriendRequestsApi(),
    enabled: isAuthenticated,
    staleTime: 30 * 1000, // 30 seconds
  });
};

export const useSendFriendRequest = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: SendFriendRequestRequest) => sendFriendRequestApi(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
      queryClient.invalidateQueries({ queryKey: ["friends"] });
    },
  });
};

export const useUnfriend = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (friendId: string) => unfriendApi(friendId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friends"] });
      queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
    },
  });
};

