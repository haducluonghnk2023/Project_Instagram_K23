import { PostItem, CommentItem } from "@/components/post";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/colors";
import { CommonStyles, Spacing } from "@/constants/styles";
import { usePost } from "@/hooks/usePost";
import { usePostComments, useCreateComment } from "@/hooks/useComment";
import { useFriends } from "@/hooks/useFriend";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState, useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Keyboard,
  Image,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { pickImageFromLibrary, takePhotoFromCamera, showImagePickerOptions } from "@/utils/imagePicker";
import { uploadImageApi } from "@/services/upload.api";
import { SwipeBackView, Avatar } from "@/components/common";

export default function PostDetailScreen() {
  const { id, from } = useLocalSearchParams<{ id: string; from?: string }>();
  const { data: post, isLoading, error } = usePost(id as string);
  const { data: comments, isLoading: isLoadingComments } = usePostComments(id as string);
  const { mutate: createComment, isPending } = useCreateComment();
  const [commentText, setCommentText] = useState("");
  const [commentImageUri, setCommentImageUri] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{ commentId: string; username: string } | null>(null);
  const [showFriendSuggestions, setShowFriendSuggestions] = useState(false);
  const [friendSuggestions, setFriendSuggestions] = useState<any[]>([]);
  const [taggedUsers, setTaggedUsers] = useState<Map<string, string>>(new Map()); // Map<userId, username>
  const [currentTagStart, setCurrentTagStart] = useState<number>(-1);
  const commentInputRef = useRef<TextInput>(null);
  const { data: friends } = useFriends();
  const insets = useSafeAreaInsets();
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const handlePickCommentImage = async () => {
    try {
      showImagePickerOptions(
        async () => {
          try {
            const result = await pickImageFromLibrary();
            if (!result.cancelled && result.uri) {
              setCommentImageUri(result.uri);
            }
          } catch (error: any) {
            Alert.alert("Lỗi", error?.message || "Không thể chọn ảnh từ thư viện");
          }
        },
        async () => {
          try {
            const result = await takePhotoFromCamera();
            if (!result.cancelled && result.uri) {
              setCommentImageUri(result.uri);
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

  const handleRemoveCommentImage = () => {
    setCommentImageUri(null);
  };

  const handleReply = (commentId: string, username: string) => {
    setReplyingTo({ commentId, username });
    // Tự động điền @username vào input
    setCommentText(`@${username} `);
    
    // Tìm userId của user được reply từ friends list
    if (friends) {
      const repliedUser = friends.find(f => {
        const friendUsername = f.user?.profile?.fullName || f.user?.email?.split('@')[0] || '';
        return friendUsername.toLowerCase() === username.toLowerCase();
      });
      if (repliedUser) {
        setTaggedUsers(new Map().set(repliedUser.userId, username));
      }
    }
    
    // Focus input sau một chút để đảm bảo UI đã render
    setTimeout(() => {
      commentInputRef.current?.focus();
    }, 100);
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
    setCommentText("");
    setCommentImageUri(null);
    setTaggedUsers(new Map());
  };

  const handleCommentTextChange = (text: string) => {
    setCommentText(text);
    
    // Detect @ symbol
    const lastAtIndex = text.lastIndexOf('@');
    if (lastAtIndex !== -1) {
      // Check if @ is followed by space or at end (not part of a tag)
      const afterAt = text.substring(lastAtIndex + 1);
      const nextSpaceIndex = afterAt.indexOf(' ');
      const tagText = nextSpaceIndex === -1 ? afterAt : afterAt.substring(0, nextSpaceIndex);
      
      // If @ is at the end or followed by text without space, show suggestions
      if (tagText.length === 0 || (!tagText.includes(' ') && tagText.length < 20)) {
        setCurrentTagStart(lastAtIndex);
        if (friends && friends.length > 0) {
          const searchText = tagText.toLowerCase();
          const filtered = friends
            .filter(friend => {
              const name = friend.user?.profile?.fullName || friend.user?.email?.split('@')[0] || '';
              return name.toLowerCase().includes(searchText);
            })
            .slice(0, 5); // Limit to 5 suggestions
          setFriendSuggestions(filtered);
          setShowFriendSuggestions(filtered.length > 0);
        }
      } else {
        setShowFriendSuggestions(false);
      }
    } else {
      setShowFriendSuggestions(false);
      setCurrentTagStart(-1);
    }
  };

  const handleSelectFriend = (friend: any) => {
    if (currentTagStart === -1) return;
    
    const username = friend.user?.profile?.fullName || friend.user?.email?.split('@')[0] || 'user';
    const userId = friend.userId;
    
    // Replace @tagText with username (without @)
    const beforeAt = commentText.substring(0, currentTagStart);
    const afterAt = commentText.substring(currentTagStart + 1);
    const nextSpaceIndex = afterAt.indexOf(' ');
    const tagText = nextSpaceIndex === -1 ? afterAt : afterAt.substring(0, nextSpaceIndex);
    
    const newText = beforeAt + username + (nextSpaceIndex === -1 ? ' ' : afterAt.substring(nextSpaceIndex));
    
    setCommentText(newText);
    setTaggedUsers(new Map(taggedUsers).set(userId, username));
    setShowFriendSuggestions(false);
    setCurrentTagStart(-1);
    
    // Focus back to input
    setTimeout(() => {
      commentInputRef.current?.focus();
    }, 100);
  };

  const handleSubmitComment = async () => {
    if (!commentText.trim() && !commentImageUri) {
      Alert.alert("Lỗi", "Vui lòng nhập nội dung hoặc chọn ảnh");
      return;
    }

    setIsUploadingImage(true);
    let uploadedImageUrl: string | undefined;

    try {
      // Upload ảnh khi submit
      if (commentImageUri) {
        try {
          uploadedImageUrl = await uploadImageApi(commentImageUri, "instagram/comments");
        } catch (error: any) {
          Alert.alert("Lỗi", error?.message || "Không thể upload ảnh");
          setIsUploadingImage(false);
          return;
        }
      }

      createComment(
        {
          postId: id as string,
          data: {
            content: commentText.trim() || "",
            imageUrl: uploadedImageUrl || undefined,
            parentCommentId: replyingTo?.commentId,
            taggedUserIds: Array.from(taggedUsers.keys()),
          },
        },
        {
          onSuccess: () => {
            setCommentText("");
            setCommentImageUri(null);
            setReplyingTo(null);
            setTaggedUsers(new Map());
            setShowFriendSuggestions(false);
          },
          onError: (error: any) => {
            const errorMessage =
              error?.response?.data?.data ||
              error?.message ||
              "Không thể bình luận";
            Alert.alert("Lỗi", errorMessage);
          },
        }
      );
    } catch (error: any) {
      Alert.alert("Lỗi", error?.message || "Không thể upload media");
    } finally {
      setIsUploadingImage(false);
    }
  };

  if (isLoading) {
    return (
      <ThemedView style={[CommonStyles.container, CommonStyles.containerCentered]}>
        <SafeAreaView edges={["top"]} style={CommonStyles.container}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </SafeAreaView>
      </ThemedView>
    );
  }

  if (error || !post) {
    return (
      <ThemedView style={[CommonStyles.container, CommonStyles.containerCentered]}>
        <SafeAreaView edges={["top"]} style={CommonStyles.container}>
          <Text style={styles.errorText}>
            Không thể tải bài viết. Vui lòng thử lại.
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              if (from) {
                router.push(decodeURIComponent(from));
              } else {
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace('/(tabs)/home');
                }
              }
            }}
          >
            <Text style={styles.retryButtonText}>Quay lại</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </ThemedView>
    );
  }

  // Hàm xử lý back navigation
  const handleBack = () => {
    if (from) {
      // Nếu có thông tin về nơi đến từ đâu, navigate về đó
      const decodedFrom = decodeURIComponent(from);
      // Kiểm tra xem có thể back được không, nếu không thì push
      if (router.canGoBack()) {
        router.back();
      } else {
        router.push(decodedFrom);
      }
    } else {
      // Nếu không có thông tin, thử back, nếu không được thì về home
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(tabs)/home');
      }
    }
  };

  return (
    <SwipeBackView enabled={true} style={CommonStyles.container} onBack={handleBack}>
      <ThemedView style={CommonStyles.container}>
        <SafeAreaView edges={["top"]} style={CommonStyles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={handleBack}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Bài viết</Text>
          <View style={styles.headerRight} />
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={CommonStyles.container}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* Post */}
            <PostItem 
              post={post} 
              onPostDeleted={() => {
                // Khi xóa bài viết từ detail screen, quay về màn hình trước
                handleBack();
              }}
            />

            {/* Comments Section */}
            <View style={styles.commentsSection}>
              <Text style={styles.commentsTitle}>
                Bình luận ({comments?.length || 0})
              </Text>

              {isLoadingComments ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={Colors.primary} />
                </View>
              ) : comments && comments.length > 0 ? (
                comments.map((comment) => (
                  <CommentItem 
                    key={comment.id} 
                    comment={comment} 
                    postId={post.id}
                    postOwnerId={post.userId}
                    onReply={handleReply}
                  />
                ))
              ) : (
                <Text style={styles.noCommentsText}>Chưa có bình luận nào</Text>
              )}
            </View>
          </ScrollView>

          {/* Comment Input */}
          <SafeAreaView edges={['bottom']} style={styles.commentInputSafeArea}>
            <View style={styles.commentInputWrapper}>
            {commentImageUri && (
              <View style={styles.commentImagePreview}>
                <Image source={{ uri: commentImageUri }} style={styles.commentImage} />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={handleRemoveCommentImage}
                >
                  <Ionicons name="close-circle" size={24} color={Colors.error} />
                </TouchableOpacity>
              </View>
            )}
            <View style={styles.commentInputContainer}>
              <View style={styles.commentInputInnerWrapper}>
                <TextInput
                  ref={commentInputRef}
                  style={styles.commentInput}
                  placeholder="Thêm bình luận..."
                  value={commentText}
                  onChangeText={handleCommentTextChange}
                  multiline
                  maxLength={500}
                  placeholderTextColor={Colors.textSecondary}
                />
                {showFriendSuggestions && friendSuggestions.length > 0 && (
                  <View style={styles.friendSuggestionsContainer}>
                    {friendSuggestions.map((friend) => {
                      const username = friend.user?.profile?.fullName || friend.user?.email?.split('@')[0] || 'user';
                      const avatarUrl = friend.user?.profile?.avatarUrl || null;
                      return (
                        <TouchableOpacity
                          key={friend.userId}
                          style={styles.friendSuggestionItem}
                          onPress={() => handleSelectFriend(friend)}
                        >
                          <Avatar source={avatarUrl} size={40} showBorder={false} />
                          <Text style={styles.friendSuggestionName}>{username}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>
              {replyingTo && (
                <TouchableOpacity 
                  style={styles.cancelReplyButton}
                  onPress={handleCancelReply}
                >
                  <Ionicons name="close-circle" size={20} color={Colors.textSecondary} />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.attachImageButton}
                onPress={handlePickCommentImage}
                disabled={isUploadingImage}
              >
                {isUploadingImage ? (
                  <ActivityIndicator size="small" color={Colors.primary} />
                ) : (
                  <Ionicons name="image-outline" size={20} color={Colors.primary} />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  ((!commentText.trim() && !commentImageUri) || isPending || isUploadingImage) && styles.sendButtonDisabled,
                ]}
                onPress={handleSubmitComment}
                disabled={(!commentText.trim() && !commentImageUri) || isPending || isUploadingImage}
              >
                {isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="send" size={20} color="#fff" />
                )}
              </TouchableOpacity>
            </View>
            </View>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </SafeAreaView>
      </ThemedView>
    </SwipeBackView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text,
    flex: 1,
    textAlign: "center",
  },
  headerRight: {
    width: 40,
  },
  scrollContent: {
    paddingBottom: Spacing.xl,
  },
  errorText: {
    fontSize: 16,
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
    fontSize: 16,
    fontWeight: "600",
  },
  commentsSection: {
    paddingHorizontal: Spacing.md,
    paddingTop: 0,
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  loadingContainer: {
    padding: Spacing.md,
    alignItems: "center",
  },
  noCommentsText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
    paddingVertical: Spacing.xl,
  },
  commentInputWrapper: {
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: Spacing.md,
    paddingBottom: Platform.OS === "android" ? Spacing.sm : Spacing.xs,
  },
  commentImagePreview: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    position: "relative",
    width: 120,
    height: 120,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: Colors.backgroundDark,
  },
  commentImage: {
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
  commentInputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: Spacing.md,
    paddingBottom: 0,
    gap: Spacing.sm,
  },
  commentInputInnerWrapper: {
    flex: 1,
    position: "relative",
  },
  commentInput: {
    width: "100%",
    maxHeight: 100,
    minHeight: 40,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    backgroundColor: Colors.backgroundSecondary,
    color: Colors.text,
    fontSize: 14,
  },
  friendSuggestionsContainer: {
    position: "absolute",
    bottom: 50,
    left: 0,
    right: 0,
    backgroundColor: Colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    maxHeight: 200,
    zIndex: 1000,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  friendSuggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.sm,
    gap: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  friendSuggestionName: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: "500",
  },
  attachImageButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.backgroundSecondary,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  cancelReplyButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.backgroundSecondary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.xs,
  },
});
