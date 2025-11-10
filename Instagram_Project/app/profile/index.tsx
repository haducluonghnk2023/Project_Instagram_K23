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
import { useFriends } from "@/hooks/useFriend";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
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
  
  // Lấy số followers/following - nếu là profile của chính mình thì dùng friends
  const { data: friends } = useFriends();
  const followersCount = isOwnProfile ? (friends?.length || 0) : 0;
  const followingCount = isOwnProfile ? (friends?.length || 0) : 0;

  const handleEditProfile = () => {
    router.push("/profile/edit");
  };

  const handleSettings = () => {
    Alert.alert("Cài đặt", "Tính năng cài đặt sẽ được thêm sau");
  };

  const handlePostPress = (post: any) => {
    router.push(`/post/detail/${post.id}`);
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
            onPress={() => router.back()}
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
    <ThemedView style={CommonStyles.container}>
      <SafeAreaView edges={["top", "bottom"]} style={CommonStyles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerIcon}>
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
            <TouchableOpacity style={styles.headerIcon}>
              <Ionicons name="ellipsis-horizontal" size={24} color={Colors.text} />
            </TouchableOpacity>
          )}
        </View>

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
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{followersCount}</Text>
                  <Text style={styles.statLabel}>người theo dõi</Text>
                </View>
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
                  <TouchableOpacity style={styles.followButton}>
                    <Text style={styles.followButtonText}>Theo dõi</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.messageButton}>
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
      </SafeAreaView>
    </ThemedView>
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
  headerIcon: {
    padding: Spacing.xs,
    width: 40,
    alignItems: "center",
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
  followButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: Spacing.sm,
    alignItems: "center",
  },
  followButtonText: {
    fontSize: FontSizes.sm,
    fontWeight: "600",
    color: "#fff",
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
