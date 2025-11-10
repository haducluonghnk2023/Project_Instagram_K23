import { Avatar, useToast } from "@/components/common";
import { Colors } from "@/constants/colors";
import { Spacing, FontSizes } from "@/constants/styles";
import { useToggleReaction } from "@/hooks/useReaction";
import { useSavePost, useUnsavePost } from "@/hooks/useSavedPost";
import { useMe } from "@/hooks/useAuth";
import { Post } from "@/types/post";
import { router } from "expo-router";
import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import {
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Modal,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Video, ResizeMode } from "expo-av";
import PostMenu from "./PostMenu";

const { width, height } = Dimensions.get("window");

interface PostItemProps {
  post: Post;
  onCommentPress?: () => void;
}

export const PostItem = React.memo(({ post, onCommentPress }: PostItemProps) => {
  const { mutate: toggleReaction, isPending } = useToggleReaction();
  const { mutate: savePost } = useSavePost();
  const { mutate: unsavePost } = useUnsavePost();
  const { data: currentUser } = useMe();
  const { showToast } = useToast();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showImageModal, setShowImageModal] = useState(false);
  const [modalImageIndex, setModalImageIndex] = useState(0);
  const [showPostMenu, setShowPostMenu] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const modalScrollViewRef = useRef<ScrollView>(null);
  
  const isOwner = useMemo(() => post.userId === currentUser?.id, [post.userId, currentUser?.id]);

  const handleLike = useCallback(() => {
    toggleReaction(post.id);
  }, [toggleReaction, post.id]);

  const handleSave = useCallback(() => {
    if (post.isSaved) {
      // Hủy lưu
      unsavePost(post.id, {
        onError: (error: any) => {
          const errorMessage = error?.response?.data?.data || error?.message || "";
          // Không hiện toast cho lỗi "not found" vì có thể bài viết đã được bỏ lưu rồi
          if (!errorMessage.includes("not found in saved posts") && !errorMessage.includes("Post not found in saved posts")) {
            showToast(errorMessage || "Không thể bỏ lưu bài viết", "error");
          }
        },
      });
    } else {
      // Lưu bài viết
      savePost(post.id, {
        onError: (error: any) => {
          const errorMessage = error?.response?.data?.data || error?.message || "";
          // Không hiện toast cho lỗi "already saved" vì có thể bài viết đã được lưu rồi
          if (!errorMessage.includes("already saved") && !errorMessage.includes("Post already saved")) {
            showToast(errorMessage || "Không thể lưu bài viết", "error");
          }
        },
      });
    }
    // Icon sẽ tự động đổi màu khi query invalidate và refetch
  }, [post.isSaved, post.id, unsavePost, savePost, showToast]);

  const handleComment = useCallback(() => {
    if (onCommentPress) {
      onCommentPress();
    } else {
      router.push(`/post/detail/${post.id}`);
    }
  }, [onCommentPress, post.id]);

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / width);
    setCurrentImageIndex(index);
  }, []);

  const handleImagePress = useCallback((index: number) => {
    setModalImageIndex(index);
    setShowImageModal(true);
  }, []);

  useEffect(() => {
    if (showImageModal && modalScrollViewRef.current && post.media && post.media.length > 1) {
      setTimeout(() => {
        modalScrollViewRef.current?.scrollTo({
          x: modalImageIndex * width,
          animated: false,
        });
      }, 100);
    }
  }, [showImageModal, modalImageIndex]);

  const handleModalScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / width);
    setModalImageIndex(index);
  }, []);

  const formatTimeAgo = useCallback((dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "vừa xong";
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return date.toLocaleDateString("vi-VN");
  }, []);

  const getVisibilityIcon = useCallback((visibility: string) => {
    switch (visibility) {
      case "public":
        return "globe-outline";
      case "private":
        return "lock-closed-outline";
      case "friends":
        return "people-outline";
      default:
        return "globe-outline";
    }
  }, []);

  const username = useMemo(() => 
    post.user?.profile?.fullName || post.user?.email?.split("@")[0] || "user",
    [post.user]
  );
  const avatarUrl = useMemo(() => 
    post.user?.profile?.avatarUrl || null,
    [post.user]
  );
  const timeAgo = useMemo(() => formatTimeAgo(post.createdAt), [post.createdAt, formatTimeAgo]);
  const visibilityIcon = useMemo(() => getVisibilityIcon(post.visibility), [post.visibility, getVisibilityIcon]);

  return (
    <View style={styles.container}>
      {/* Post Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Avatar source={avatarUrl} size={32} showBorder />
          <Text style={styles.username}>{username}</Text>
          {isOwner && (
            <Ionicons
              name={visibilityIcon as any}
              size={14}
              color={Colors.textSecondary}
              style={styles.visibilityIcon}
            />
          )}
        </View>
        {isOwner && (
          <TouchableOpacity onPress={() => setShowPostMenu(true)}>
            <Ionicons name="ellipsis-horizontal" size={20} color={Colors.text} />
          </TouchableOpacity>
        )}
      </View>

      {/* Post Menu */}
      {currentUser && (
        <PostMenu
          post={post}
          currentUserId={currentUser.id}
          visible={showPostMenu}
          onClose={() => setShowPostMenu(false)}
        />
      )}

      {/* Post Media */}
      {post.media && post.media.length > 0 && (
        <View style={styles.mediaContainer}>
          {post.media.length > 1 ? (
            <ScrollView
              ref={scrollViewRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={handleScroll}
              scrollEventThrottle={16}
              style={styles.mediaScrollView}
            >
              {post.media.map((media, index) => (
                <TouchableOpacity
                  key={index}
                  activeOpacity={1}
                  onPress={() => handleImagePress(index)}
                >
                  {media.mediaType === 'video' ? (
                    <Video
                      source={{ uri: media.mediaUrl }}
                      style={styles.mediaImage}
                      resizeMode={ResizeMode.COVER}
                      shouldPlay={false}
                      useNativeControls={false}
                    />
                  ) : (
                    <Image
                      source={{ uri: media.mediaUrl }}
                      style={styles.mediaImage}
                      resizeMode="cover"
                    />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => handleImagePress(0)}
            >
              {post.media[0].mediaType === 'video' ? (
                <Video
                  source={{ uri: post.media[0].mediaUrl }}
                  style={styles.mediaImage}
                  resizeMode={ResizeMode.COVER}
                  shouldPlay={false}
                  useNativeControls={false}
                />
              ) : (
                <Image
                  source={{ uri: post.media[0].mediaUrl }}
                  style={styles.mediaImage}
                  resizeMode="cover"
                />
              )}
            </TouchableOpacity>
          )}
          {post.media.length > 1 && (
            <View style={styles.paginationDots}>
              {post.media.map((_, index) => (
                <View
                  key={index}
                  style={[styles.dot, index === currentImageIndex && styles.dotActive]}
                />
              ))}
            </View>
          )}
        </View>
      )}

      {/* Full Screen Image Modal */}
      <Modal
        visible={showImageModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowImageModal(false)}
      >
        <StatusBar hidden={true} />
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setShowImageModal(false)}
          >
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          {post.media && post.media.length > 1 ? (
            <ScrollView
              ref={modalScrollViewRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={handleModalScroll}
              scrollEventThrottle={16}
            >
              {post.media.map((media, index) => (
                <View key={index} style={styles.modalImageContainer}>
                  {media.mediaType === 'video' ? (
                    <Video
                      source={{ uri: media.mediaUrl }}
                      style={styles.modalImage}
                      resizeMode={ResizeMode.CONTAIN}
                      shouldPlay={index === modalImageIndex}
                      useNativeControls
                      isLooping
                    />
                  ) : (
                    <Image
                      source={{ uri: media.mediaUrl }}
                      style={styles.modalImage}
                      resizeMode="contain"
                    />
                  )}
                </View>
              ))}
            </ScrollView>
          ) : (
            post.media && (
              <View style={styles.modalImageContainer}>
                {post.media[0].mediaType === 'video' ? (
                  <Video
                    source={{ uri: post.media[0].mediaUrl }}
                    style={styles.modalImage}
                    resizeMode={ResizeMode.CONTAIN}
                    shouldPlay={true}
                    useNativeControls
                    isLooping
                  />
                ) : (
                  <Image
                    source={{ uri: post.media[0].mediaUrl }}
                    style={styles.modalImage}
                    resizeMode="contain"
                  />
                )}
              </View>
            )
          )}
          {post.media && post.media.length > 1 && (
            <View style={styles.modalPaginationDots}>
              {post.media.map((_, index) => (
                <View
                  key={index}
                  style={[styles.modalDot, index === modalImageIndex && styles.modalDotActive]}
                />
              ))}
            </View>
          )}
        </View>
      </Modal>

      {/* Post Actions */}
      <View style={styles.actions}>
        <View style={styles.actionsLeft}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleLike}
            disabled={isPending}
          >
            <Ionicons
              name={post.hasReacted ? "heart" : "heart-outline"}
              size={24}
              color={post.hasReacted ? Colors.error : Colors.text}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleComment}>
            <Ionicons name="chatbubble-outline" size={24} color={Colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="paper-plane-outline" size={24} color={Colors.text} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={handleSave}>
          <Ionicons 
            name={post.isSaved ? "bookmark" : "bookmark-outline"} 
            size={24} 
            color={post.isSaved ? Colors.primary : Colors.text} 
          />
        </TouchableOpacity>
      </View>

      {/* Post Likes */}
      {post.reactionCount > 0 && (
        <Text style={styles.likes}>
          {String(post.reactionCount)} lượt thích
        </Text>
      )}

      {/* Post Caption */}
      {post.content && (
        <View style={styles.caption}>
          <Text style={styles.captionText}>
            <Text style={styles.captionUsername}>{username}</Text>{" "}
            {post.content}
          </Text>
        </View>
      )}

      {/* Post Comments */}
      {post.commentCount > 0 && (
        <TouchableOpacity style={styles.comments} onPress={handleComment}>
          <Text style={styles.commentsText}>
            Xem tất cả {String(post.commentCount)} bình luận
          </Text>
        </TouchableOpacity>
      )}

      {/* Post Time */}
      <Text style={styles.time}>{timeAgo}</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    paddingBottom: Spacing.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  username: {
    fontSize: FontSizes.md,
    fontWeight: "600",
    color: Colors.text,
  },
  visibilityIcon: {
    marginLeft: Spacing.xs,
  },
  mediaContainer: {
    width: width,
    height: width,
    backgroundColor: Colors.backgroundSecondary,
    position: "relative",
  },
  mediaScrollView: {
    width: width,
    height: width,
  },
  mediaImage: {
    width: width,
    height: width,
  },
  paginationDots: {
    position: "absolute",
    bottom: Spacing.sm,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.xs,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
  },
  dotActive: {
    backgroundColor: Colors.primary,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  actionsLeft: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  actionButton: {
    padding: Spacing.xs,
  },
  likes: {
    fontSize: FontSizes.md,
    fontWeight: "600",
    color: Colors.text,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.xs,
  },
  caption: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.xs,
  },
  captionText: {
    fontSize: FontSizes.md,
    color: Colors.text,
  },
  captionUsername: {
    fontWeight: "600",
  },
  comments: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.xs,
  },
  commentsText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  time: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.95)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCloseButton: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalImageContainer: {
    width: width,
    height: height,
    justifyContent: "center",
    alignItems: "center",
  },
  modalImage: {
    width: width,
    height: height,
  },
  modalPaginationDots: {
    position: "absolute",
    bottom: 50,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.xs,
  },
  modalDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
  },
  modalDotActive: {
    backgroundColor: Colors.primary,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});

