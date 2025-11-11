import { Avatar } from "@/components/common";
import { Colors } from "@/constants/colors";
import { Spacing, FontSizes } from "@/constants/styles";
import {
  useDeleteComment,
  useCommentReplies,
  useCreateComment,
} from "@/hooks/useComment";
import { Comment } from "@/types/post";
import React, { useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useMe } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { useFriends } from "@/hooks/useFriend";
import {
  pickImageFromLibrary,
  takePhotoFromCamera,
  showImagePickerOptions,
} from "@/utils/imagePicker";
import { uploadImageApi } from "@/services/upload.api";

interface CommentItemProps {
  comment: Comment;
  postId: string;
  postOwnerId?: string; // ID của chủ bài viết
  onReply?: (parentCommentId: string, username: string) => void;
  isReply?: boolean;
}

export function CommentItem({
  comment,
  postId,
  postOwnerId,
  onReply,
  isReply = false,
}: CommentItemProps) {
  const { mutate: deleteComment } = useDeleteComment();
  const { mutate: createComment, isPending: isReplying } = useCreateComment();
  const { data: currentUser } = useMe();
  const { data: friends } = useFriends();
  const {
    data: replies,
    isLoading: isLoadingReplies,
    refetch: refetchReplies,
  } = useCommentReplies(postId, comment.id);
  const queryClient = useQueryClient();
  const [showReplies, setShowReplies] = useState(false);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replyImageUri, setReplyImageUri] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const isOwnComment = currentUser?.id === comment.userId;
  const isPostOwner = currentUser?.id === postOwnerId;
  // Hiển thị nút xóa nếu là comment của chính mình hoặc là chủ bài viết
  const canDelete = isOwnComment || isPostOwner;

  const handleDelete = () => {
    Alert.alert("Xóa bình luận", "Bạn có chắc chắn muốn xóa bình luận này?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: () => {
          // Truyền replyCount để tính đúng số lượng comments bị xóa
          deleteComment({ 
            postId, 
            commentId: comment.id,
            replyCount: comment.replyCount || 0,
          });
        },
      },
    ]);
  };

  const handleToggleReplies = () => {
    setShowReplies(!showReplies);
  };

  const handleReplyPress = () => {
    if (onReply) {
      const username =
        comment.user?.profile?.fullName ||
        comment.user?.email?.split("@")[0] ||
        "user";
      onReply(comment.id, username);
    } else {
      // Fallback: hiển thị input ngay dưới comment nếu không có onReply callback
      setShowReplyInput(!showReplyInput);
    }
  };

  const handlePickReplyImage = async () => {
    try {
      showImagePickerOptions(
        async () => {
          try {
            const result = await pickImageFromLibrary();
            if (!result.cancelled && result.uri) {
              setReplyImageUri(result.uri);
            }
          } catch (error: any) {
            Alert.alert(
              "Lỗi",
              error?.message || "Không thể chọn ảnh từ thư viện"
            );
          }
        },
        async () => {
          try {
            const result = await takePhotoFromCamera();
            if (!result.cancelled && result.uri) {
              setReplyImageUri(result.uri);
            }
          } catch (error: any) {
            Alert.alert("Lỗi", error?.message || "Không thể chụp ảnh");
          }
        }
      );
    } catch (error: any) {
      Alert.alert("Lỗi", error?.message || "Không thể mở image picker");
    }
  };

  const handleRemoveReplyImage = () => {
    setReplyImageUri(null);
  };

  const handleSubmitReply = async () => {
    if (!replyText.trim() && !replyImageUri) {
      Alert.alert("Lỗi", "Vui lòng nhập nội dung hoặc chọn ảnh");
      return;
    }

    setIsUploadingImage(true);
    let uploadedImageUrl: string | undefined;

    try {
      // Upload ảnh khi submit
      if (replyImageUri) {
        try {
          uploadedImageUrl = await uploadImageApi(
            replyImageUri,
            "instagram/comments"
          );
        } catch (error: any) {
          Alert.alert("Lỗi", error?.message || "Không thể upload ảnh");
          setIsUploadingImage(false);
          return;
        }
      }

      createComment(
        {
          postId,
          data: {
            content: replyText.trim() || "",
            parentCommentId: comment.id,
            imageUrl: uploadedImageUrl || undefined,
          },
        },
        {
          onSuccess: () => {
            setReplyText("");
            setReplyImageUri(null);
            setShowReplyInput(false);
            setShowReplies(true);
            // Refetch replies ngay lập tức để hiển thị reply mới
            setTimeout(() => {
              queryClient.invalidateQueries({
                queryKey: ["commentReplies", postId, comment.id],
              });
              refetchReplies();
            }, 100);
          },
          onError: (error: any) => {
            const errorMessage =
              error?.response?.data?.data ||
              error?.message ||
              "Không thể phản hồi";
            Alert.alert("Lỗi", errorMessage);
          },
        }
      );
    } finally {
      setIsUploadingImage(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
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
  };

  const username =
    comment.user?.profile?.fullName ||
    comment.user?.email?.split("@")[0] ||
    "user";
  const avatarUrl = comment.user?.profile?.avatarUrl || null;

  // Tạo map từ userId -> username để highlight
  const taggedUsersMap = new Map<string, string>();
  if (comment.taggedUserIds && friends) {
    comment.taggedUserIds.forEach((taggedUserId) => {
      const friend = friends.find((f) => f.userId === taggedUserId);
      if (friend) {
        const taggedUsername =
          friend.user?.profile?.fullName ||
          friend.user?.email?.split("@")[0] ||
          "";
        if (taggedUsername) {
          taggedUsersMap.set(taggedUsername.toLowerCase(), taggedUserId);
        }
      }
    });
  }

  // Render comment text với highlight cho tagged users
  const renderCommentText = (text: string) => {
    if (!text || taggedUsersMap.size === 0) {
      return <Text style={styles.commentText}>{text}</Text>;
    }

    const parts: Array<{ text: string; isTagged: boolean }> = [];
    let currentIndex = 0;

    // Tìm tất cả tên được tag trong text (case-insensitive)
    const taggedNames: Array<{ name: string; index: number; length: number }> =
      [];
    taggedUsersMap.forEach((userId, nameLower) => {
      // Escape special regex characters
      const escapedName = nameLower.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`\\b${escapedName}\\b`, "gi");
      let match;
      while ((match = regex.exec(text)) !== null) {
        taggedNames.push({
          name: match[0], // Giữ nguyên case gốc trong text
          index: match.index,
          length: match[0].length,
        });
      }
    });

    // Sắp xếp theo index
    taggedNames.sort((a, b) => a.index - b.index);

    // Loại bỏ overlaps
    const filteredNames: Array<{
      name: string;
      index: number;
      length: number;
    }> = [];
    taggedNames.forEach((tagged) => {
      const overlaps = filteredNames.some(
        (existing) =>
          tagged.index < existing.index + existing.length &&
          tagged.index + tagged.length > existing.index
      );
      if (!overlaps) {
        filteredNames.push(tagged);
      }
    });

    // Tạo parts
    filteredNames.forEach(({ name, index, length }) => {
      if (index > currentIndex) {
        parts.push({
          text: text.substring(currentIndex, index),
          isTagged: false,
        });
      }
      parts.push({ text: name, isTagged: true });
      currentIndex = index + length;
    });

    if (currentIndex < text.length) {
      parts.push({ text: text.substring(currentIndex), isTagged: false });
    }

    if (parts.length === 0) {
      return <Text style={styles.commentText}>{text}</Text>;
    }

    return (
      <Text style={styles.commentText}>
        {parts.map((part, index) => (
          <Text
            key={index}
            style={part.isTagged ? styles.taggedText : undefined}
          >
            {part.text}
          </Text>
        ))}
      </Text>
    );
  };

  return (
    <View style={[styles.container, isReply && styles.replyContainer]}>
      <Avatar source={avatarUrl} size={isReply ? 28 : 32} showBorder />
      <View style={styles.content}>
        <View style={[styles.commentBubble, isReply && styles.replyBubble]}>
          <Text style={styles.username}>{username}</Text>
          {comment.content && renderCommentText(comment.content)}
          {comment.imageUrl && (
            <View style={styles.commentImageContainer}>
              <Image
                source={{ uri: comment.imageUrl }}
                style={styles.commentImage}
                resizeMode="cover"
              />
            </View>
          )}
        </View>
        <View style={styles.commentActions}>
          <Text style={styles.time}>{formatTimeAgo(comment.createdAt)}</Text>
          {comment.replyCount > 0 && (
            <TouchableOpacity onPress={handleToggleReplies}>
              <Text style={styles.replyText}>
                {showReplies ? "Ẩn" : "Xem"} {String(comment.replyCount)} phản
                hồi
              </Text>
            </TouchableOpacity>
          )}
          {/* Chỉ hiển thị nút "Phản hồi" nếu không phải là reply (chỉ cho phép 2 cấp) */}
          {!isReply && (
            <TouchableOpacity onPress={handleReplyPress}>
              <Text style={styles.replyText}>Phản hồi</Text>
            </TouchableOpacity>
          )}
          {canDelete && (
            <TouchableOpacity onPress={handleDelete}>
              <Ionicons name="trash-outline" size={16} color={Colors.error} />
            </TouchableOpacity>
          )}
        </View>

        {/* Reply Input */}
        {showReplyInput && (
          <View style={styles.replyInputContainer}>
            <View style={styles.replyInputWrapper}>
              <TextInput
                style={styles.replyInput}
                placeholder="Viết phản hồi..."
                value={replyText}
                onChangeText={setReplyText}
                multiline
                maxLength={500}
                placeholderTextColor={Colors.textSecondary}
              />
              <TouchableOpacity
                style={styles.attachImageButton}
                onPress={handlePickReplyImage}
                disabled={isUploadingImage}
              >
                {isUploadingImage ? (
                  <ActivityIndicator size="small" color={Colors.primary} />
                ) : (
                  <Ionicons
                    name="image-outline"
                    size={20}
                    color={Colors.primary}
                  />
                )}
              </TouchableOpacity>
            </View>
            {replyImageUri && (
              <View style={styles.replyImagePreview}>
                <Image
                  source={{ uri: replyImageUri }}
                  style={styles.replyImage}
                />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={handleRemoveReplyImage}
                >
                  <Ionicons
                    name="close-circle"
                    size={24}
                    color={Colors.error}
                  />
                </TouchableOpacity>
              </View>
            )}
            <View style={styles.replyInputActions}>
              <TouchableOpacity
                onPress={() => {
                  setShowReplyInput(false);
                  setReplyText("");
                  setReplyImageUri(null);
                }}
              >
                <Text style={styles.cancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.sendReplyButton,
                  ((!replyText.trim() && !replyImageUri) ||
                    isReplying ||
                    isUploadingImage) &&
                    styles.sendReplyButtonDisabled,
                ]}
                onPress={handleSubmitReply}
                disabled={
                  (!replyText.trim() && !replyImageUri) ||
                  isReplying ||
                  isUploadingImage
                }
              >
                {isReplying ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="send" size={16} color="#fff" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Replies List */}
        {showReplies && (
          <View style={styles.repliesContainer}>
            {isLoadingReplies ? (
              <ActivityIndicator
                size="small"
                color={Colors.primary}
                style={styles.repliesLoading}
              />
            ) : replies && replies.length > 0 ? (
              replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  postId={postId}
                  postOwnerId={postOwnerId}
                  isReply={true}
                />
              ))
            ) : (
              <Text style={styles.noRepliesText}>Chưa có phản hồi</Text>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    marginBottom: Spacing.lg,
    gap: Spacing.md,
    paddingRight: Spacing.sm,
  },
  content: {
    flex: 1,
  },
  commentBubble: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 20,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.xs,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  username: {
    fontSize: FontSizes.sm,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 2,
  },
  commentText: {
    fontSize: FontSizes.md,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  taggedText: {
    fontWeight: "600",
    color: Colors.primary,
  },
  commentImageContainer: {
    marginTop: Spacing.sm,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: Colors.backgroundDark,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  commentImage: {
    width: 220,
    height: 220,
    maxWidth: "100%",
  },
  commentActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingHorizontal: Spacing.xs,
    marginTop: Spacing.xs,
  },
  time: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
  },
  replyText: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    fontWeight: "600",
  },
  replyContainer: {
    marginLeft: Spacing.md, // Giảm từ lg xuống md (từ ~24px xuống ~16px)
    marginTop: Spacing.xs, // Giảm spacing trên
    paddingLeft: Spacing.sm, // Giảm padding bên trái (từ ~16px xuống ~12px)
    borderLeftWidth: 1, // Giảm độ dày border (từ 2 xuống 1)
    borderLeftColor: Colors.borderLight, // Dùng màu border nhạt hơn
    // Xóa opacity để reply comments không bị mờ
  },
  replyBubble: {
    // Dùng cùng style như commentBubble để đảm bảo độ rõ nét giống nhau
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 20,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.xs,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  replyInputContainer: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  replyInputWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: Spacing.sm,
  },
  replyInput: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 20,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    color: Colors.text,
    fontSize: FontSizes.sm,
    minHeight: 40,
    maxHeight: 100,
  },
  attachImageButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  replyImagePreview: {
    marginTop: Spacing.sm,
    position: "relative",
    width: 120,
    height: 120,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: Colors.backgroundDark,
  },
  replyImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  removeImageButton: {
    position: "absolute",
    top: Spacing.xs,
    right: Spacing.xs,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 12,
  },
  replyInputActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  cancelText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    paddingHorizontal: Spacing.sm,
  },
  sendReplyButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  sendReplyButtonDisabled: {
    opacity: 0.5,
  },
  repliesContainer: {
    marginTop: Spacing.xs, // Giảm spacing trên
    paddingLeft: Spacing.md, // Giảm padding bên trái (từ lg ~24px xuống md ~16px)
    borderLeftWidth: 1,
    borderLeftColor: Colors.borderLight, // Dùng màu border nhạt hơn
    // Xóa opacity để reply comments không bị mờ
  },
  repliesLoading: {
    padding: Spacing.sm,
  },
  noRepliesText: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    fontStyle: "italic",
    padding: Spacing.sm,
  },
});
