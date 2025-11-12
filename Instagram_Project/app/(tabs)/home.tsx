import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { Avatar } from "@/components/common";
import { Colors } from "@/constants/colors";
import { Spacing, FontSizes } from "@/constants/styles";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { useFeed } from "@/hooks/usePost";
import { useQueryClient } from "@tanstack/react-query";
import { PostItem } from "@/components/post";
import { useAuthContext } from "@/contexts/AuthContext";
import { useUnreadNotificationCount } from "@/hooks/useNotification";
import { useFriends } from "@/hooks/useFriend";
import { useMe } from "@/hooks/useAuth";
import { useSavedPosts } from "@/hooks/useSavedPost";
import { isStory, filterRegularPosts } from "@/utils/post";
import { getUserDisplayName, formatUsername, getAvatarUrl } from "@/utils/user";
import { LIMITS } from "@/constants/limits";
import { Post } from "@/types/post";
import { useSwipeBack } from "@/hooks/useSwipeBack";

const { width } = Dimensions.get("window");

export default function HomeTab() {
  const { isAuthenticated } = useAuthContext();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const { data: posts, isLoading, error, refetch, isFetching } = useFeed(page, 10);
  const { data: unreadCount } = useUnreadNotificationCount();
  const { data: friends } = useFriends();
  const { data: currentUser } = useMe();
  const { data: savedPosts } = useSavedPosts();
  const swipeBackHandlers = useSwipeBack(false); // Disable for home tab (root screen)

  // Tạo Set các post IDs đã được lưu để merge vào feed posts
  const savedPostIds = React.useMemo(() => {
    if (!savedPosts || !Array.isArray(savedPosts)) return new Set<string>();
    return new Set(savedPosts.map(post => post.id));
  }, [savedPosts]);

  // Merge isSaved từ savedPosts vào feed posts
  const postsWithSavedStatus = React.useMemo(() => {
    if (!posts || !Array.isArray(posts)) return posts;
    return posts.map(post => ({
      ...post,
      isSaved: savedPostIds.has(post.id),
    }));
  }, [posts, savedPostIds]);

  // Accumulate posts for infinite scroll
  React.useEffect(() => {
    if (postsWithSavedStatus && Array.isArray(postsWithSavedStatus)) {
      if (page === 0) {
        // Luôn update allPosts khi page === 0, kể cả khi empty array
        // Điều này đảm bảo khi xóa bài viết cuối cùng, UI sẽ hiển thị empty state
        // Và khi có post mới từ cache, nó sẽ được hiển thị ngay
        setAllPosts(postsWithSavedStatus);
      } else {
        // Load more: chỉ thêm posts mới, không reset
        setAllPosts((prev) => {
          // Tránh duplicate posts
          const existingIds = new Set(prev.map(p => p.id));
          const newPosts = postsWithSavedStatus.filter(p => !existingIds.has(p.id));
          if (newPosts.length > 0) {
            return [...prev, ...newPosts];
          }
          return prev; // Không thay đổi nếu không có posts mới
        });
      }
    }
  }, [postsWithSavedStatus, page]);

  // Refetch feed when screen is focused (when returning from other screens)
  // This ensures we have the latest posts, especially after creating a new post
  // Only refetch if we're on page 0 to avoid unnecessary requests
  const isFirstFocus = React.useRef(true);
  useFocusEffect(
    React.useCallback(() => {
      // Skip refetch on initial mount (React Query will fetch automatically)
      if (isFirstFocus.current) {
        isFirstFocus.current = false;
        return;
      }
      
      // Only refetch page 0 when returning to screen
      if (page === 0) {
        // Đợi một chút để đảm bảo navigation đã hoàn tất
        const timer = setTimeout(() => {
          // Refetch feed và savedPosts để đảm bảo isSaved được sync đúng
          refetch();
          queryClient.invalidateQueries({ queryKey: ["savedPosts"] });
        }, 300);
        return () => clearTimeout(timer);
      }
    }, [page, refetch, queryClient])
  );

  // Check if user has story (posts with video in last 24 hours, NOT reels)
  const checkHasStory = (userId: string): boolean => {
    if (allPosts.length === 0) return false;
    return allPosts.some((post) => {
      if (post.userId !== userId) return false;
      return isStory(post);
    });
  };

  // Build stories from friends list
  const stories = useMemo(() => {
    const storyList: Array<{
      id: string;
      username: string;
      avatar: string | null;
      isYourStory?: boolean;
      hasStory?: boolean;
    }> = [];

    // Add "Your Story" first
    if (currentUser) {
      const hasStory = checkHasStory(currentUser.id);
      storyList.push({
        id: "your-story",
        username: "Tin của bạn",
        avatar: currentUser.profile?.avatarUrl || null,
        isYourStory: true,
        hasStory,
      });
    }

    // Add friends' stories (limit for performance)
    if (friends && friends.length > 0) {
      friends.slice(0, LIMITS.MAX_STORIES_DISPLAY).forEach((friend) => {
        const friendUser = friend.user;
        const friendUsername = getUserDisplayName(friendUser);
        const hasStory = checkHasStory(friend.userId);
        storyList.push({
          id: friend.userId,
          username: formatUsername(friendUsername),
          avatar: getAvatarUrl(friendUser),
          hasStory,
        });
      });
    }

    return storyList;
  }, [friends, currentUser, allPosts]);

  // Filter posts to exclude reels (posts that are only videos without content)
  // Note: regularPosts is now computed from allPosts in render

  const handleRefresh = async () => {
    // Set page về 0 trước
    setPage(0);
    
    // Invalidate và refetch query với page = 0
    // Điều này đảm bảo fetch lại từ đầu
    await queryClient.invalidateQueries({ 
      queryKey: ["posts", "feed", 0, 10],
      refetchType: "active" // Chỉ refetch nếu query đang active
    });
    
    // Refetch để đảm bảo có data mới
    await refetch();
  };

  const handleLoadMore = () => {
    if (!isFetching && posts && posts.length >= 10) {
      setPage((prev) => prev + 1);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
        {/* Top Bar */}
        <View style={styles.topBar}>
          <View style={styles.topBarLeft}>
            <Text style={styles.instagramText}>Instagram</Text>
            <Ionicons name="chevron-down" size={16} color={Colors.text} />
          </View>
          <View style={styles.topBarRight}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => router.push("/post/create")}
            >
              <Ionicons name="add-outline" size={24} color={Colors.text} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => router.push("/notification")}
            >
              <View style={styles.notificationIconContainer}>
                <Ionicons name="heart-outline" size={24} color={Colors.text} />
                {(unreadCount ?? 0) > 0 && (
                  <View style={styles.notificationBadge}>
                    <Text style={styles.notificationBadgeText}>
                      {unreadCount! > 9 ? '9+' : String(unreadCount!)}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => router.push("/message")}
            >
              <Ionicons name="paper-plane-outline" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          style={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={isLoading && page === 0} onRefresh={handleRefresh} />
          }
          onScroll={(event) => {
            const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
            const paddingToBottom = 20;
            if (layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom) {
              handleLoadMore();
            }
          }}
          scrollEventThrottle={400}
        >
          {/* Stories Section */}
          <View style={styles.storiesContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.storiesScroll}
            >
              {stories.map((story) => (
                <TouchableOpacity
                  key={story.id}
                  style={styles.storyItem}
                  activeOpacity={0.7}
                  onPress={() => {
                    if (story.isYourStory) {
                      if (story.hasStory) {
                        // View your stories
                        router.push(`/story/viewer?userId=${currentUser?.id}&initialStoryIndex=0`);
                      } else {
                        // Create new story
                        router.push("/story/create");
                      }
                    } else {
                      if (story.hasStory) {
                        // View friend's stories
                        router.push(`/story/viewer?userId=${story.id}&initialStoryIndex=0`);
                      } else {
                        // Navigate to friend's profile
                        router.push(`/profile?userId=${story.id}`);
                      }
                    }
                  }}
                >
                  <View style={styles.storyAvatarContainer}>
                    {story.hasStory ? (
                      // Rainbow border gradient for stories
                      <LinearGradient
                        colors={['#f09433', '#e6683c', '#dc2743', '#cc2366', '#bc1888']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.storyGradient}
                      >
                        <View style={styles.storyAvatarInner}>
                          <Avatar
                            source={story.avatar}
                            size={60}
                            showBorder={false}
                          />
                        </View>
                      </LinearGradient>
                    ) : (
                      <View style={styles.storyAvatarInner}>
                        <Avatar
                          source={story.avatar}
                          size={64}
                          showBorder={!story.isYourStory}
                        />
                      </View>
                    )}
                    {story.isYourStory && (
                      <View style={styles.addStoryIcon}>
                        <Ionicons
                          name="add"
                          size={16}
                          color={Colors.textLight}
                        />
                      </View>
                    )}
                  </View>
                  <Text style={styles.storyUsername} numberOfLines={1}>
                    {story.username}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Posts Feed */}
          {isLoading && page === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>
                Không thể tải bài viết. Vui lòng thử lại.
              </Text>
              <TouchableOpacity onPress={handleRefresh} style={styles.retryButton}>
                <Text style={styles.retryButtonText}>Thử lại</Text>
              </TouchableOpacity>
            </View>
          ) : allPosts && allPosts.length > 0 ? (
            <>
              {filterRegularPosts(allPosts).map((post) => (
                <PostItem
                  key={post.id}
                  post={post}
                  onCommentPress={() => router.push(`/post/detail/${post.id}`)}
                  onPostDeleted={(deletedPostId) => {
                    // Optimistic update: remove bài viết đã xóa khỏi local state ngay lập tức
                    setAllPosts((prev) => prev.filter((p) => p.id !== deletedPostId));
                  }}
                />
              ))}
              {isFetching && page > 0 && (
                <View style={styles.loadingMoreContainer}>
                  <ActivityIndicator size="small" color={Colors.primary} />
                </View>
              )}
            </>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="image-outline" size={64} color={Colors.textSecondary} />
              <Text style={styles.emptyText}>Chưa có bài viết nào</Text>
              <TouchableOpacity
                style={styles.createPostButton}
                onPress={() => router.push("/post/create")}
              >
                <Text style={styles.createPostButtonText}>Tạo bài viết đầu tiên</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Suggested Content - Removed hardcoded content */}
          {/* Có thể thêm lại sau khi có API suggested posts/users */}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  safeArea: {
    flex: 1,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  topBarLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  instagramText: {
    fontSize: FontSizes.xl,
    fontWeight: "600",
    color: Colors.text,
  },
  topBarRight: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  iconButton: {
    padding: Spacing.xs,
  },
  notificationIconContainer: {
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: Colors.error,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.background,
  },
  notificationBadgeText: {
    color: Colors.textLight,
    fontSize: 10,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  storiesContainer: {
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    marginBottom: Spacing.sm,
  },
  storiesScroll: {
    paddingHorizontal: Spacing.sm,
    gap: Spacing.md,
  },
  storyItem: {
    alignItems: "center",
    width: 70,
    marginRight: Spacing.sm,
  },
  storyAvatarContainer: {
    position: "relative",
    marginBottom: Spacing.xs,
  },
  storyGradient: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
    padding: 3,
  },
  storyAvatarInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: "hidden",
    backgroundColor: Colors.background,
    justifyContent: "center",
    alignItems: "center",
  },
  addStoryIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: Colors.background,
  },
  storyUsername: {
    fontSize: FontSizes.xs,
    color: Colors.text,
    textAlign: "center",
    maxWidth: 70,
  },
  loadingContainer: {
    padding: Spacing.xl,
    alignItems: "center",
  },
  errorContainer: {
    padding: Spacing.xl,
    alignItems: "center",
  },
  errorText: {
    fontSize: FontSizes.md,
    color: Colors.error,
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  retryButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: FontSizes.md,
    fontWeight: "600",
  },
  emptyContainer: {
    padding: Spacing.xl * 2,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  loadingMoreContainer: {
    padding: Spacing.md,
    alignItems: "center",
  },
  createPostButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  createPostButtonText: {
    color: "#fff",
    fontSize: FontSizes.md,
    fontWeight: "600",
  },
});
