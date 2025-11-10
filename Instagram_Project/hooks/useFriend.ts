import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getFriendsApi, getBlockedUsersApi, FriendInfo } from "@/services/friend.api";
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

export const useBlockedUsers = () => {
  const { isAuthenticated } = useAuthContext();
  
  return useQuery<FriendInfo[]>({
    queryKey: ["blockedUsers"],
    queryFn: () => getBlockedUsersApi(),
    enabled: isAuthenticated,
    staleTime: 30 * 1000, // 30 seconds
  });
};

