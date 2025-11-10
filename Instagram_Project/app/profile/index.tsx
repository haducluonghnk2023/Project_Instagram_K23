import { Button } from "@/components/common";
import {
  PostGrid,
  ProfileTabs,
  TabType,
} from "@/components/profile";
import { ThemedView } from "@/components/themed-view";
import { Avatar } from "@/components/common";
import { Colors } from "@/constants/colors";
import { CommonStyles, Spacing, FontSizes } from "@/constants/styles";
import { useAuthContext } from "@/contexts/AuthContext";
import { useMe, useUser } from "@/hooks/useAuth";
import { useUserPosts } from "@/hooks/usePost";
import { useSavedPosts } from "@/hooks/useSavedPost";
import { useFriends, useUserFriends, useFriendRequests, useSendFriendRequest, useUnfriend } from "@/hooks/useFriend";
import { blockUserApi } from "@/services/friend.api";
import { getErrorMessage } from "@/utils/error";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState, useMemo } from "react";
import { ConfirmDialog } from "@/components/common";
import { useToast } from "@/components/common/ToastProvider";
import { useQueryClient } from "@tanstack/react-query";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { SwipeBackView } from "@/components/common";

export default function ProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId?: string }>();
  const { data: currentUser } = useMe();
  const isOwnProfile = !userId || userId === currentUser?.id;
  
  // Use current user data if viewing own profile, otherwise fetch user by ID
  const { data: viewedUser, isLoading: isLoadingUser, error: userError } = useUser(
    userId || "",
    { enabled: !isOwnProfile && !!userId }
  );
  
  const userInfo = isOwnProfile ? currentUser : viewedUser;
  const { data: posts, isLoading: isLoadingPosts } = useUserPosts(
    userId || currentUser?.id || "",
    0, // page
    10, // size
    { enabled: !!userInfo?.id }
  );
  const { data: savedPosts, isLoading: isLoadingSaved } = useSavedPosts();
  
  const [activeTab, setActiveTab] = useState<TabType>("grid");
  
  // Filter posts based on active tab
  const getDisplayedPosts = () => {
    if (!isOwnProfile) {
      // Nếu xem profile người khác, chỉ hiển thị grid và video
      switch (activeTab) {
        case "video":
          return posts?.filter((post) => 
            post.media && post.media.some((m) => m.mediaType === "video")
          ) || [];
        case "grid":
        default:
          return posts || [];
      }
    }
    
    // Nếu là profile của chính mình
    switch (activeTab) {
      case "bookmark":
        return savedPosts || [];
      case "video":
        return posts?.filter((post) => 
          post.media && post.media.some((m) => m.mediaType === "video")
        ) || [];
      case "tagged":
        return [];
      case "grid":
      default:
        return posts || [];
    }
  };
  
  const displayedPosts = getDisplayedPosts();

  const profile = userInfo?.profile;
  const username = userInfo?.email?.split("@")[0] || "username";
  const fullName = profile?.fullName || userInfo?.email || "Chưa có tên";
  const bio = profile?.bio || null;
  const avatar = profile?.avatarUrl || null;
  // Đếm số bài viết thật (backend đã filter posts đã xóa)
  const postsCount = posts?.length || 0;
  
  // Lấy số followers/following
  const { data: friends } = useFriends();
  const { data: viewedUserFriends } = useUserFriends(
    userId || "",
    { enabled: !isOwnProfile && !!userId }
  );
  const { data: friendRequests } = useFriendRequests();
  const { mutate: sendFriendRequest, isPending: isSendingRequest } = useSendFriendRequest();
  const { mutate: unfriend, isPending: isUnfriending } = useUnfriend();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  
  // Nếu là profile của chính mình thì dùng friends của mình
  // Nếu là profile người khác thì dùng friends của họ
  const friendsList = isOwnProfile ? friends : viewedUserFriends;
  const followersCount = friendsList?.length || 0;
  const followingCount = friendsList?.length || 0; // Vì friends là mutual nên following = followers

  // Kiểm tra trạng thái bạn bè và friend request
  const friendshipStatus = useMemo(() => {
    if (isOwnProfile || !userId || !currentUser) {
      return null;
    }

    // Kiểm tra xem đã là bạn bè chưa (từ danh sách friends của mình)
    const friendInfo = friends?.find(f => f.userId === userId);
    if (friendInfo) {
      return { type: 'friend' as const, friendId: friendInfo.userId }; // Backend cần userId, không phải id của friendship
    }

    // Kiểm tra xem đã gửi request chưa
    const sentRequest = friendRequests?.find(
      req => req.fromUserId === currentUser.id && req.toUserId === userId && req.status === 'pending'
    );
    if (sentRequest) {
      return { type: 'sent_request' as const, requestId: sentRequest.id };
    }

    // Kiểm tra xem có request đến từ user này chưa
    const receivedRequest = friendRequests?.find(
      req => req.fromUserId === userId && req.toUserId === currentUser.id && req.status === 'pending'
    );
    if (receivedRequest) {
      return { type: 'received_request' as const, requestId: receivedRequest.id };
    }

    return { type: 'none' as const };
  }, [friends, friendRequests, userId, currentUser, isOwnProfile]);

  const [showUnfriendDialog, setShowUnfriendDialog] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);

  const handleEditProfile = () => {
    router.push("/profile/edit");
  };

  const handleSettings = () => {
    Alert.alert("Cài đặt", "Tính năng cài đặt sẽ được thêm sau");
  };

  const handleFriendAction = () => {
    if (!userId || !userInfo?.phone) return;

    if (friendshipStatus?.type === 'friend') {
      // Đã là bạn bè - hiện dialog hủy kết bạn
      setShowUnfriendDialog(true);
    } else if (friendshipStatus?.type === 'sent_request') {
      // Đã gửi request - có thể hủy request (tùy chọn)
      showToast("Đã gửi lời mời kết bạn", "info");
    } else if (friendshipStatus?.type === 'received_request') {
      // Có request đến - chuyển đến trang requests để chấp nhận
      router.push("/(tabs)/friend/requests");
    } else {
      // Chưa có gì - gửi friend request
      sendFriendRequest(
        { phone: userInfo.phone },
        {
          onSuccess: () => {
            showToast("Đã gửi lời mời kết bạn", "success");
          },
          onError: (error: any) => {
            const message = error?.response?.data?.data || error?.message || "Không thể gửi lời mời kết bạn";
            showToast(message, "error");
          },
        }
      );
    }
  };

  const handleUnfriend = () => {
    if (!friendshipStatus || friendshipStatus.type !== 'friend' || !friendshipStatus.friendId || !userId) return;

    unfriend(friendshipStatus.friendId, {
      onSuccess: () => {
        setShowUnfriendDialog(false);
        showToast("Đã hủy kết bạn", "success");
        // Invalidate queries để cập nhật UI
        queryClient.invalidateQueries({ queryKey: ["friends"] });
        if (userId) {
          queryClient.invalidateQueries({ queryKey: ["friends", userId] });
        }
      },
      onError: (error: any) => {
        const message = error?.response?.data?.data || error?.message || "Không thể hủy kết bạn";
        showToast(message, "error");
      },
    });
  };

  const handlePostPress = (post: any) => {
    // Truyền thông tin về nơi đến từ đâu để biết back về đâu
    const profilePath = userId ? `/profile?userId=${userId}` : '/profile';
    router.push(`/post/detail/${post.id}?from=${encodeURIComponent(profilePath)}`);
  };

  const handleMessage = () => {
    if (userInfo?.id) {
      router.push(`/message/chat/${userInfo.id}`);
    }
  };

  const handleMenuPress = () => {
    setShowMenu(!showMenu);
  };

  const handleBlock = () => {
    setShowMenu(false);
    setShowBlockConfirm(true);
  };

  const confirmBlock = async () => {
    if (!userId || !userInfo) return;
    
    setIsBlocking(true);
    try {
      await blockUserApi({ userId });
      setShowBlockConfirm(false);
      showToast(`Đã chặn ${fullName}`, "success");
      // Invalidate queries để cập nhật UI
      queryClient.invalidateQueries({ queryKey: ["friends"] });
      queryClient.invalidateQueries({ queryKey: ["blockedUsers"] });
      // Quay lại màn hình trước
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(tabs)/home');
      }
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      showToast(errorMessage || "Không thể chặn người dùng", "error");
    } finally {
      setIsBlocking(false);
    }
  };

  if (isLoadingUser && !isOwnProfile) {
    return (
      <ThemedView style={[CommonStyles.container, CommonStyles.containerCentered]}>
        <SafeAreaView edges={["top", "bottom"]} style={CommonStyles.container}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </SafeAreaView>
      </ThemedView>
    );
  }

  if (userError && !isOwnProfile) {
    return (
      <ThemedView style={[CommonStyles.container, CommonStyles.containerCentered]}>
        <SafeAreaView edges={["top", "bottom"]} style={CommonStyles.container}>
          <Text style={styles.errorText}>
            Không thể tải thông tin profile
          </Text>
          <Button
            title="Quay lại"
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/(tabs)/home');
              }
            }}
            variant="primary"
            style={{ marginTop: Spacing.md }}
          />
        </SafeAreaView>
      </ThemedView>
    );
  }

  if (!userInfo) {
    return (
      <ThemedView style={[CommonStyles.container, CommonStyles.containerCentered]}>
        <SafeAreaView edges={["top", "bottom"]} style={CommonStyles.container}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </SafeAreaView>
      </ThemedView>
    );
  }

  return (
    <SwipeBackView enabled={true} style={CommonStyles.container}>
      <ThemedView style={CommonStyles.container}>
      <SafeAreaView edges={["top", "bottom"]} style={CommonStyles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/(tabs)/home');
              }
            }} 
            style={styles.headerIcon}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerUsername}>{username}</Text>
          </View>
          {isOwnProfile ? (
            <TouchableOpacity onPress={handleSettings} style={styles.headerIcon}>
              <Ionicons name="settings-outline" size={24} color={Colors.text} />
            </TouchableOpacity>
          ) : (
            <View style={styles.headerIconContainer}>
              <TouchableOpacity 
                style={styles.headerIcon}
                onPress={handleMenuPress}
              >
                <Ionicons name="ellipsis-horizontal" size={24} color={Colors.text} />
              </TouchableOpacity>
              {showMenu && (
                <View style={styles.menu}>
                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={handleBlock}
                  >
                    <Ionicons name="ban-outline" size={20} color={Colors.error} />
                    <Text style={[styles.menuItemText, { color: Colors.error }]}>Chặn</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => setShowMenu(false)}
                  >
                    <Text style={styles.menuItemText}>Hủy</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </View>

        <TouchableOpacity 
          activeOpacity={1} 
          onPress={() => setShowMenu(false)}
          style={{ flex: 1 }}
        >
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Profile Info Section */}
          <View style={styles.profileSection}>
            <View style={styles.profileRow}>
              <View style={styles.avatarContainer}>
                <Avatar source={avatar} size={90} showBorder={false} />
              </View>
              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{postsCount}</Text>
                  <Text style={styles.statLabel}>bài viết</Text>
                </View>
                <TouchableOpacity 
                  style={styles.statItem}
                  onPress={() => {
                    if (userId) {
                      router.push(`/profile/followers?userId=${userId}`);
                    } else {
                      router.push('/profile/followers');
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.statNumber}>{followersCount}</Text>
                  <Text style={styles.statLabel}>người theo dõi</Text>
                </TouchableOpacity>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{followingCount}</Text>
                  <Text style={styles.statLabel}>Đang theo dõi</Text>
                </View>
              </View>
            </View>

            {/* Name and Username */}
            <View style={styles.nameSection}>
              <Text style={styles.fullName}>{fullName}</Text>
              {bio && <Text style={styles.bio}>{bio}</Text>}
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              {isOwnProfile ? (
                <>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={handleEditProfile}
                  >
                    <Text style={styles.editButtonText}>Chỉnh sửa trang cá nhân</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.archiveButton}
                    onPress={handleSettings}
                  >
                    <Text style={styles.archiveButtonText}>Xem kho lưu trữ</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TouchableOpacity 
                    style={[
                      styles.friendButton,
                      friendshipStatus?.type === 'friend' && styles.friendButtonActive
                    ]}
                    onPress={handleFriendAction}
                    disabled={isSendingRequest || isUnfriending}
                  >
                    {isSendingRequest || isUnfriending ? (
                      <ActivityIndicator size="small" color={friendshipStatus?.type === 'friend' ? Colors.text : "#fff"} />
                    ) : (
                      <Text style={[
                        styles.friendButtonText,
                        friendshipStatus?.type === 'friend' && styles.friendButtonTextActive
                      ]}>
                        {friendshipStatus?.type === 'friend' 
                          ? 'Bạn bè' 
                          : friendshipStatus?.type === 'sent_request'
                          ? 'Đã gửi lời mời'
                          : friendshipStatus?.type === 'received_request'
                          ? 'Phản hồi'
                          : 'Kết bạn'}
                      </Text>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.messageButton}
                    onPress={handleMessage}
                  >
                    <Text style={styles.messageButtonText}>Nhắn tin</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>

          {/* Content Tabs */}
          <ProfileTabs 
            activeTab={activeTab} 
            onTabChange={setActiveTab}
            showSavedTab={isOwnProfile}
          />

          {/* Posts Grid */}
          {((activeTab === "grid" || activeTab === "video") && isLoadingPosts) || 
           (activeTab === "bookmark" && isLoadingSaved) ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          ) : displayedPosts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons 
                name={
                  activeTab === "bookmark" 
                    ? "bookmark-outline" 
                    : activeTab === "video"
                    ? "videocam-outline"
                    : "image-outline"
                } 
                size={64} 
                color={Colors.textSecondary} 
              />
              <Text style={styles.emptyText}>
                {activeTab === "bookmark" 
                  ? "Chưa có bài viết nào được lưu" 
                  : activeTab === "video"
                  ? "Chưa có video nào"
                  : "Chưa có bài viết nào"}
              </Text>
            </View>
          ) : (
            <PostGrid posts={displayedPosts} onPostPress={handlePostPress} />
          )}
        </ScrollView>
        </TouchableOpacity>
      </SafeAreaView>
      </ThemedView>

      {/* Unfriend Dialog */}
      <ConfirmDialog
        visible={showUnfriendDialog}
        title="Hủy kết bạn"
        message={`Bạn có chắc chắn muốn hủy kết bạn với ${fullName}?`}
        confirmText="Hủy kết bạn"
        cancelText="Đóng"
        type="danger"
        onConfirm={handleUnfriend}
        onCancel={() => setShowUnfriendDialog(false)}
      />

      {/* Block Dialog */}
      <ConfirmDialog
        visible={showBlockConfirm}
        title="Chặn người dùng"
        message={`Bạn có chắc chắn muốn chặn ${fullName}? Người này sẽ không thể xem bài viết của bạn hoặc nhắn tin cho bạn.`}
        confirmText="Chặn"
        cancelText="Hủy"
        type="danger"
        onConfirm={confirmBlock}
        onCancel={() => setShowBlockConfirm(false)}
      />
    </SwipeBackView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  headerIconContainer: {
    position: "relative",
  },
  headerIcon: {
    padding: Spacing.xs,
    width: 40,
    alignItems: "center",
  },
  menu: {
    position: "absolute",
    top: 40,
    right: 0,
    backgroundColor: Colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    minWidth: 150,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1000,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  menuItemText: {
    fontSize: FontSizes.md,
    color: Colors.text,
    fontWeight: "500",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerUsername: {
    fontSize: FontSizes.lg,
    fontWeight: "600",
    color: Colors.text,
  },
  profileSection: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: Spacing.md,
  },
  avatarContainer: {
    marginRight: Spacing.lg,
  },
  statsContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingTop: Spacing.sm,
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: FontSizes.md,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: FontSizes.xs,
    color: Colors.text,
  },
  nameSection: {
    marginBottom: Spacing.md,
  },
  fullName: {
    fontSize: FontSizes.md,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 4,
  },
  bio: {
    fontSize: FontSizes.sm,
    color: Colors.text,
  },
  actionButtons: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  editButton: {
    flex: 1,
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingVertical: Spacing.sm,
    alignItems: "center",
  },
  editButtonText: {
    fontSize: FontSizes.sm,
    fontWeight: "600",
    color: Colors.text,
  },
  archiveButton: {
    flex: 1,
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingVertical: Spacing.sm,
    alignItems: "center",
  },
  archiveButtonText: {
    fontSize: FontSizes.sm,
    fontWeight: "600",
    color: Colors.text,
  },
  friendButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: Spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 36,
  },
  friendButtonActive: {
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  friendButtonText: {
    fontSize: FontSizes.sm,
    fontWeight: "600",
    color: "#fff",
  },
  friendButtonTextActive: {
    color: Colors.text,
  },
  messageButton: {
    flex: 1,
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingVertical: Spacing.sm,
    alignItems: "center",
  },
  messageButtonText: {
    fontSize: FontSizes.sm,
    fontWeight: "600",
    color: Colors.text,
  },
  loadingContainer: {
    padding: Spacing.xl,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 200,
  },
  emptyContainer: {
    padding: Spacing.xl * 2,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 200,
  },
  emptyText: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
    textAlign: "center",
  },
  errorText: {
    fontSize: FontSizes.md,
    color: Colors.error,
    textAlign: "center",
    marginBottom: Spacing.md,
  },
});
