import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Video, ResizeMode, AVPlaybackStatus } from "expo-av";
import { ThemedView } from "@/components/themed-view";
import { Avatar } from "@/components/common";
import { Colors } from "@/constants/colors";
import { Spacing, FontSizes } from "@/constants/styles";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useReels } from "@/hooks/usePost";
import { useToggleReaction } from "@/hooks/useReaction";
import { Post } from "@/types/post";
import { useAuthContext } from "@/contexts/AuthContext";

const { width, height } = Dimensions.get("window");

interface ReelItemProps {
  reel: Post;
  isActive: boolean;
  onPressComment: () => void;
  onPressProfile: () => void;
}

const ReelItem: React.FC<ReelItemProps> = ({
  reel,
  isActive,
  onPressComment,
  onPressProfile,
}) => {
  const videoRef = useRef<Video>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const { mutate: toggleReaction, isPending: isTogglingReaction } = useToggleReaction();

  // Get first video from media
  const videoMedia = reel.media.find((m) => m.mediaType === "video");
  const videoUrl = videoMedia?.mediaUrl;

  // Delay video rendering to ensure native module is ready
  useEffect(() => {
    if (videoUrl) {
      const timer = setTimeout(() => {
        setIsVideoReady(true);
      }, 100); // Small delay to ensure native module is ready
      return () => clearTimeout(timer);
    }
  }, [videoUrl]);

  useEffect(() => {
    if (isActive && videoRef.current && !hasError && isVideoReady) {
      // Add a small delay before playing to ensure Video component is fully mounted
      const playTimer = setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.playAsync().catch((error) => {
            console.error('Error playing video:', error);
            setHasError(true);
          });
          setIsPlaying(true);
        }
      }, 50);
      return () => clearTimeout(playTimer);
    } else if (videoRef.current && !isActive) {
      videoRef.current.pauseAsync().catch((error) => {
        console.error('Error pausing video:', error);
      });
      setIsPlaying(false);
    }
  }, [isActive, hasError, isVideoReady]);

  const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      setIsPlaying(status.isPlaying);
      if (status.error) {
        console.error('Video playback error:', status.error);
        setHasError(true);
      }
    }
  };

  const handleVideoError = (error: string) => {
    console.error('Video error:', error);
    setHasError(true);
    setIsVideoReady(false);
  };

  const handleVideoLoad = () => {
    // Video loaded successfully
    setIsVideoReady(true);
    setHasError(false);
  };

  const handleTogglePlay = async () => {
    if (!videoRef.current || hasError) return;
    try {
      if (isPlaying) {
        await videoRef.current.pauseAsync();
      } else {
        await videoRef.current.playAsync();
      }
    } catch (error) {
      console.error('Error toggling play:', error);
      setHasError(true);
    }
  };

  const handleToggleMute = () => {
    setIsMuted(!isMuted);
  };

  const handleToggleReaction = () => {
    toggleReaction(reel.id);
  };

  if (!videoUrl || !videoUrl.trim()) {
    return null; // Skip if no video or invalid URL
  }

  // Don't render Video component until ready
  if (!isVideoReady && !hasError) {
    return (
      <View style={styles.reelContainer}>
        <View style={styles.loadingVideoContainer}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
        {/* Overlay */}
        <View style={styles.overlay}>
          <View style={styles.leftSection}>
            <TouchableOpacity
              style={styles.userInfo}
              onPress={onPressProfile}
              activeOpacity={0.7}
            >
              <Avatar
                source={reel.user.profile?.avatarUrl || null}
                size={40}
                showBorder={false}
              />
              <Text style={styles.username}>
                {reel.user.profile?.fullName || reel.user.email?.split("@")[0] || "User"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  if (hasError) {
    return (
      <View style={styles.reelContainer}>
        <View style={styles.errorContainer}>
          <Ionicons name="videocam-off-outline" size={48} color={Colors.textSecondary} />
          <Text style={styles.errorText}>Không thể phát video</Text>
        </View>
        {/* Overlay still works */}
        <View style={styles.overlay}>
          <View style={styles.leftSection}>
            <TouchableOpacity
              style={styles.userInfo}
              onPress={onPressProfile}
              activeOpacity={0.7}
            >
              <Avatar
                source={reel.user.profile?.avatarUrl || null}
                size={40}
                showBorder={false}
              />
              <Text style={styles.username}>
                {reel.user.profile?.fullName || reel.user.email?.split("@")[0] || "User"}
              </Text>
            </TouchableOpacity>
            {reel.content && (
              <Text style={styles.content} numberOfLines={3}>
                {reel.content}
              </Text>
            )}
          </View>
          <View style={styles.rightSection}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleToggleReaction}
              disabled={isTogglingReaction}
            >
              <Ionicons
                name={reel.hasReacted ? "heart" : "heart-outline"}
                size={32}
                color={reel.hasReacted ? Colors.error : "#fff"}
              />
              <Text style={styles.actionText}>{String(reel.reactionCount)}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={onPressComment}>
              <Ionicons name="chatbubble-outline" size={32} color="#fff" />
              <Text style={styles.actionText}>{String(reel.commentCount)}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.reelContainer}>
      {videoUrl && isVideoReady && (
        <Video
          ref={videoRef}
          source={{ uri: videoUrl }}
          style={styles.video}
          resizeMode={ResizeMode.COVER}
          shouldPlay={false} // Don't auto-play, control manually
          isLooping
          isMuted={isMuted}
          onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
          onError={handleVideoError}
          onLoad={handleVideoLoad}
          useNativeControls={false}
          posterSource={undefined}
        />
      )}

      {/* Overlay */}
      <View style={styles.overlay}>
        {/* Left side - User info and content */}
        <View style={styles.leftSection}>
          <TouchableOpacity
            style={styles.userInfo}
            onPress={onPressProfile}
            activeOpacity={0.7}
          >
            <Avatar
              source={reel.user.profile?.avatarUrl || null}
              size={40}
              showBorder={false}
            />
            <Text style={styles.username}>
              {reel.user.profile?.fullName || reel.user.email?.split("@")[0] || "User"}
            </Text>
          </TouchableOpacity>

          {reel.content && (
            <Text style={styles.content} numberOfLines={3}>
              {reel.content}
            </Text>
          )}
        </View>

        {/* Right side - Actions */}
        <View style={styles.rightSection}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleToggleReaction}
            disabled={isTogglingReaction}
          >
            <Ionicons
              name={reel.hasReacted ? "heart" : "heart-outline"}
              size={32}
              color={reel.hasReacted ? Colors.error : "#fff"}
            />
            <Text style={styles.actionText}>{String(reel.reactionCount)}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={onPressComment}>
            <Ionicons name="chatbubble-outline" size={32} color="#fff" />
            <Text style={styles.actionText}>{String(reel.commentCount)}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleToggleMute}>
            <Ionicons
              name={isMuted ? "volume-mute-outline" : "volume-high-outline"}
              size={28}
              color="#fff"
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleTogglePlay}>
            <Ionicons
              name={isPlaying ? "pause" : "play"}
              size={28}
              color="#fff"
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default function ReelsScreen() {
  const { isAuthenticated } = useAuthContext();
  const [page, setPage] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const { data: reels, isLoading, error, refetch } = useReels(page, 10);
  const flatListRef = useRef<FlatList>(null);

  const handleRefresh = () => {
    setPage(0);
    refetch();
  };

  const handleLoadMore = () => {
    if (!isLoading && reels && reels.length >= 10) {
      setPage((prev) => prev + 1);
    }
  };

  const handleViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index || 0);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  // Filter reels to only show those with video
  const videoReels = reels?.filter((reel) =>
    reel.media.some((m) => m.mediaType === "video")
  ) || [];

  if (!isAuthenticated) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Vui lòng đăng nhập để xem Reels</Text>
          </View>
        </SafeAreaView>
      </ThemedView>
    );
  }

  if (isLoading && page === 0) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        </SafeAreaView>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>
              Không thể tải Reels. Vui lòng thử lại.
            </Text>
            <TouchableOpacity onPress={handleRefresh} style={styles.retryButton}>
              <Text style={styles.retryButtonText}>Thử lại</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </ThemedView>
    );
  }

  if (videoReels.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
          <View style={styles.emptyContainer}>
            <Ionicons name="videocam-outline" size={64} color={Colors.textSecondary} />
            <Text style={styles.emptyText}>Chưa có Reels nào</Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => router.push("/reels/create")}
            >
              <Text style={styles.createButtonText}>Tạo Reel đầu tiên</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={["top"]} style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              // If can go back, go back, otherwise navigate to home
              if (router.canGoBack()) {
                router.back();
              } else {
                router.push("/(tabs)/home");
              }
            }}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Reels</Text>
          <TouchableOpacity
            onPress={() => router.push("/reels/create")}
            style={styles.headerIcon}
          >
            <Ionicons name="camera-outline" size={24} color={Colors.text} />
          </TouchableOpacity>
        </View>

        {/* Reels List */}
        <FlatList
          ref={flatListRef}
          data={videoReels}
          renderItem={({ item, index }) => (
            <ReelItem
              reel={item}
              isActive={index === activeIndex}
              onPressComment={() => router.push(`/post/detail/${item.id}`)}
              onPressProfile={() => router.push(`/profile?userId=${item.userId}`)}
            />
          )}
          keyExtractor={(item) => item.id}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          snapToInterval={height}
          snapToAlignment="start"
          decelerationRate="fast"
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          onViewableItemsChanged={handleViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          refreshControl={
            <RefreshControl
              refreshing={isLoading && page === 0}
              onRefresh={handleRefresh}
              tintColor={Colors.primary}
            />
          }
        />
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: Spacing.xs,
    marginRight: Spacing.sm,
  },
  headerTitle: {
    flex: 1,
    fontSize: FontSizes.xl,
    fontWeight: "600",
    color: Colors.text,
    textAlign: "center",
  },
  headerIcon: {
    padding: Spacing.xs,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
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
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl * 2,
  },
  emptyText: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
    textAlign: "center",
  },
  createButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  createButtonText: {
    color: "#fff",
    fontSize: FontSizes.md,
    fontWeight: "600",
  },
  reelContainer: {
    width,
    height: height - 100, // Adjust for header
    backgroundColor: "#000",
  },
  video: {
    width: "100%",
    height: "100%",
  },
  overlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: Spacing.md,
  },
  leftSection: {
    flex: 1,
    justifyContent: "flex-end",
    paddingBottom: Spacing.lg,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  username: {
    fontSize: FontSizes.md,
    fontWeight: "600",
    color: "#fff",
    marginLeft: Spacing.sm,
  },
  content: {
    fontSize: FontSizes.sm,
    color: "#fff",
    marginTop: Spacing.xs,
  },
  rightSection: {
    justifyContent: "flex-end",
    alignItems: "center",
    gap: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  actionButton: {
    alignItems: "center",
    gap: Spacing.xs,
  },
  actionText: {
    fontSize: FontSizes.xs,
    color: "#fff",
    fontWeight: "600",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  errorText: {
    fontSize: FontSizes.md,
    color: "#fff",
    marginTop: Spacing.md,
  },
  loadingVideoContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
});
