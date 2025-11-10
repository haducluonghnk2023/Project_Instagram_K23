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
import { useMe, useUpdateMe } from "@/hooks/useAuth";
import { useUserPosts } from "@/hooks/usePost";
import { useSavedPosts } from "@/hooks/useSavedPost";
import { useFriends } from "@/hooks/useFriend";
import { useUnreadNotificationCount } from "@/hooks/useNotification";
import { router } from "expo-router";
import React, { useState } from "react";
import { uploadAvatarApi } from "@/services/upload.api";
import { showImagePickerOptions, pickImageFromLibrary, takePhotoFromCamera } from "@/utils/imagePicker";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { ConfirmDialog } from "@/components/common";
import { useToast } from "@/components/common/ToastProvider";
import { showErrorFromException } from "@/utils/toast";
import { SwipeBackView } from '@/components/common';

export default function ProfileTab() {
  const [activeTab, setActiveTab] = useState<TabType>("grid");
  const { logout, isAuthenticated, token, isLoading: authLoading } = useAuthContext();
  // Chỉ gọi useMe khi đã authenticated và có token
  const { data: userInfo, isLoading, error, refetch } = useMe();
  const { mutate: updateProfile, isPending: isUpdatingAvatar } = useUpdateMe();
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const { showToast } = useToast();
  
  // Get real data - using pagination
  const { data: posts } = useUserPosts(userInfo?.id || "", 0, 10, { enabled: !!userInfo?.id });
  const { data: savedPosts, isLoading: isLoadingSaved } = useSavedPosts();
  const { data: friends } = useFriends();
  const { data: unreadCount } = useUnreadNotificationCount();
  
  // Đếm số bài viết thật (backend đã filter posts đã xóa)
  const postsCount = posts?.length || 0;
  
  // Filter posts based on active tab
  const getDisplayedPosts = () => {
    switch (activeTab) {
      case "bookmark":
        return savedPosts || [];
      case "video":
        // Filter posts with video
        return posts?.filter((post) => 
          post.media && post.media.some((m) => m.mediaType === "video")
        ) || [];
      case "tagged":
        // Tagged posts - chưa có API, trả về empty
        return [];
      case "grid":
      default:
        return posts || [];
    }
  };
  
  const displayedPosts = getDisplayedPosts();
  // Số người theo dõi = số bạn bè
  const followersCount = friends?.length || 0;
  // Số đang theo dõi = số bạn bè (vì kết bạn là mutual)
  const followingCount = friends?.length || 0;

  // Redirect về login nếu không authenticated (sau khi đã check auth xong)
  React.useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/auth/login");
    }
  }, [isAuthenticated, authLoading]);

  // Hiển thị toast khi có lỗi authentication
  React.useEffect(() => {
    if (error) {
      const errorAny = error as any;
      const isUnauthorized = 
        errorAny?.response?.status === 401 || 
        errorAny?.message?.includes("Phiên đăng nhập đã hết hạn");
      
      if (isUnauthorized) {
        showToast("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.", "error", 5000);
      }
    }
  }, [error, showToast]);

  const profile = userInfo?.profile;
  const username = userInfo?.email?.split("@")[0] || "username";
  const fullName = profile?.fullName || userInfo?.email || "Chưa có tên";
  const bio = profile?.bio || null;
  const avatar = profile?.avatarUrl || null;

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = async () => {
    try {
      await logout();
      setShowLogoutConfirm(false);
      // Navigation sẽ được xử lý tự động bởi RootLayoutNav khi isAuthenticated = false
    } catch (error) {
      setShowLogoutConfirm(false);
      showToast("Không thể đăng xuất. Vui lòng thử lại.", "error");
    }
  };

  const handleEditProfile = () => {
    router.push("/profile/edit");
  };

  const handleSettings = () => {
    showToast("Tính năng cài đặt sẽ được thêm sau", "info");
  };

  const handleAvatarPress = () => {
    showImagePickerOptions(
      async () => {
        // Chọn từ thư viện
        const result = await pickImageFromLibrary();
        if (!result.cancelled && result.uri) {
          await handleImageSelected(result.uri);
        }
      },
      async () => {
        // Chụp từ camera
        const result = await takePhotoFromCamera();
        if (!result.cancelled && result.uri) {
          await handleImageSelected(result.uri);
        }
      }
    );
  };

  const handleImageSelected = async (imageUri: string) => {
    setIsUploadingAvatar(true);
    try {
      // Upload ảnh lên Cloudinary
      const uploadedUrl = await uploadAvatarApi(imageUri);
      
      // Cập nhật profile với URL mới
      updateProfile(
        {
          avatarUrl: uploadedUrl,
        },
        {
          onSuccess: () => {
            showToast("Đã cập nhật ảnh đại diện!", "success");
            refetch(); // Refresh để hiển thị ảnh mới
          },
          onError: (error: unknown) => {
            const errorMessage = getErrorMessage(error);
            showToast(errorMessage || "Không thể cập nhật ảnh đại diện", "error");
          },
        }
      );
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      showToast(errorMessage || 'Không thể upload ảnh', 'error');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handlePostPress = (post: any) => {
    // Truyền thông tin về nơi đến từ đâu để biết back về đâu
    const profilePath = '/(tabs)/profile';
    router.push(`/post/detail/${post.id}?from=${encodeURIComponent(profilePath)}`);
  };

  // Hiển thị loading khi đang check auth
  if (authLoading) {
    return (
      <ThemedView style={[CommonStyles.container, CommonStyles.containerCentered]}>
        <SafeAreaView edges={["top", "bottom"]} style={CommonStyles.container}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </SafeAreaView>
      </ThemedView>
    );
  }

  // Nếu không authenticated, không render gì (sẽ redirect về login)
  if (!isAuthenticated) {
    return null;
  }

  // Hiển thị loading khi đang fetch user data
  if (isLoading) {
    return (
      <ThemedView style={[CommonStyles.container, CommonStyles.containerCentered]}>
        <SafeAreaView edges={["top", "bottom"]} style={CommonStyles.container}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </SafeAreaView>
      </ThemedView>
    );
  }

  if (error) {
    const errorMessage = error instanceof Error 
      ? error.message 
      : (error as any)?.response?.data?.message || "Không thể tải thông tin profile";
    const isUnauthorized = (error as any)?.response?.status === 401;
    
    return (
      <ThemedView style={[CommonStyles.container, CommonStyles.containerCentered]}>
        <SafeAreaView edges={["top", "bottom"]} style={CommonStyles.container}>
          <Text style={styles.errorText}>
            {isUnauthorized 
              ? "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại." 
              : errorMessage}
          </Text>
          {isUnauthorized ? (
            <Button
              title="Đăng nhập lại"
              onPress={() => logout()}
              variant="primary"
              style={{ marginTop: Spacing.md }}
            />
          ) : (
            <Button
              title="Thử lại"
              onPress={() => refetch()}
              variant="primary"
              style={{ marginTop: Spacing.md }}
            />
          )}
        </SafeAreaView>
      </ThemedView>
    );
  }

  return (
    <SwipeBackView enabled={true} style={CommonStyles.container}>
      <ThemedView style={CommonStyles.container}>
      <SafeAreaView edges={["top"]} style={CommonStyles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleSettings} style={styles.headerIcon}>
            <Ionicons name="settings-outline" size={24} color={Colors.text} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerUsername}>{username}</Text>
            <Ionicons name="chevron-down" size={16} color={Colors.text} />
          </View>
          <TouchableOpacity onPress={() => router.push("/notification")} style={styles.headerIcon}>
            <View style={styles.notificationBadge}>
              <Ionicons name="notifications-outline" size={24} color={Colors.text} />
              {(unreadCount ?? 0) > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {unreadCount! > 9 ? '9+' : String(unreadCount!)}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Profile Info Section */}
          <View style={styles.profileSection}>
            <View style={styles.profileRow}>
              <TouchableOpacity
                style={styles.avatarContainer}
                onPress={handleAvatarPress}
                disabled={isUploadingAvatar || isUpdatingAvatar}
              >
                <Avatar source={avatar} size={90} showBorder={false} />
                {(isUploadingAvatar || isUpdatingAvatar) && (
                  <View style={styles.avatarLoadingOverlay}>
                    <ActivityIndicator size="small" color="#fff" />
                  </View>
                )}
                <View style={styles.avatarEditIcon}>
                  <Ionicons name="camera" size={20} color="#fff" />
                </View>
              </TouchableOpacity>
              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{String(postsCount)}</Text>
                  <Text style={styles.statLabel}>bài viết</Text>
                </View>
                <TouchableOpacity 
                  style={styles.statItem}
                  onPress={() => router.push('/profile/followers')}
                >
                  <Text style={styles.statNumber}>{String(followersCount)}</Text>
                  <Text style={styles.statLabel}>người theo dõi</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.statItem}
                  onPress={() => router.push('/(tabs)/friend')}
                >
                  <Text style={styles.statNumber}>{String(followingCount)}</Text>
                  <Text style={styles.statLabel}>Đang theo dõi</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Name and Username */}
            <View style={styles.nameSection}>
              <Text style={styles.fullName}>{fullName}</Text>
              <Text style={styles.username}>@{username}</Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
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
            </View>

            {/* Story Highlights */}
            <View style={styles.highlightsContainer}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.highlights}
              >
                <View style={styles.highlightItem}>
                  <View style={styles.highlightCircle}>
                    <Ionicons name="add" size={32} color={Colors.text} />
                  </View>
                  <Text style={styles.highlightLabel}>Mới</Text>
                </View>
              </ScrollView>
            </View>
          </View>

          {/* Content Tabs */}
          <ProfileTabs 
            activeTab={activeTab} 
            onTabChange={setActiveTab}
            showSavedTab={true} // Always show saved tab for own profile
          />

          {/* Posts Grid */}
          {activeTab === "bookmark" && isLoadingSaved ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          ) : displayedPosts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons 
                name={activeTab === "bookmark" ? "bookmark-outline" : "image-outline"} 
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

          {/* Logout Button */}
          <View style={styles.logoutContainer}>
            <Button
              title="Đăng xuất"
              onPress={handleLogout}
              variant="danger"
              fullWidth
              style={styles.logoutButton}
            />
          </View>
        </ScrollView>
      </SafeAreaView>

      <ConfirmDialog
        visible={showLogoutConfirm}
        title="Đăng xuất"
        message="Bạn có chắc chắn muốn đăng xuất?"
        confirmText="Đăng xuất"
        cancelText="Hủy"
        type="warning"
        onConfirm={confirmLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
      </ThemedView>
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
  headerIcon: {
    padding: Spacing.xs,
  },
  headerCenter: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  headerUsername: {
    fontSize: FontSizes.lg,
    fontWeight: "600",
    color: Colors.text,
  },
  notificationBadge: {
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: Colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 18,
    paddingHorizontal: 4,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: Colors.background,
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
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
    position: "relative",
  },
  avatarLoadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 45,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarEditIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: Colors.primary,
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: Colors.background,
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
    marginBottom: 2,
  },
  username: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
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
  highlightsContainer: {
    marginBottom: Spacing.md,
  },
  highlights: {
    paddingRight: Spacing.md,
  },
  highlightItem: {
    alignItems: "center",
    marginRight: Spacing.md,
  },
  highlightCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 1.5,
    borderColor: Colors.border,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.backgroundSecondary,
    marginBottom: Spacing.xs,
  },
  highlightLabel: {
    fontSize: FontSizes.xs,
    color: Colors.text,
  },
  logoutContainer: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xl * 2,
  },
  logoutButton: {
    marginTop: Spacing.md,
  },
  errorText: {
    fontSize: FontSizes.md,
    color: Colors.error,
    textAlign: "center",
    marginBottom: Spacing.md,
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
});

