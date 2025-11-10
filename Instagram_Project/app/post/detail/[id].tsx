import { PostItem, CommentItem } from "@/components/post";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/colors";
import { CommonStyles, Spacing } from "@/constants/styles";
import { usePost } from "@/hooks/usePost";
import { usePostComments, useCreateComment } from "@/hooks/useComment";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState, useEffect } from "react";
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

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: post, isLoading, error } = usePost(id as string);
  const { data: comments, isLoading: isLoadingComments } = usePostComments(id as string);
  const { mutate: createComment, isPending } = useCreateComment();
  const [commentText, setCommentText] = useState("");
  const [commentImageUri, setCommentImageUri] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
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
          },
        },
        {
          onSuccess: () => {
            setCommentText("");
            setCommentImageUri(null);
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
            onPress={() => router.back()}
          >
            <Text style={styles.retryButtonText}>Quay lại</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={CommonStyles.container}>
      <SafeAreaView edges={["top"]} style={CommonStyles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
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
            <PostItem post={post} />

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
                  <CommentItem key={comment.id} comment={comment} postId={post.id} />
                ))
              ) : (
                <Text style={styles.noCommentsText}>Chưa có bình luận nào</Text>
              )}
            </View>
          </ScrollView>

          {/* Comment Input */}
          <SafeAreaView edges={['bottom']} style={styles.commentInputWrapper}>
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
              <TextInput
                style={styles.commentInput}
                placeholder="Thêm bình luận..."
                value={commentText}
                onChangeText={setCommentText}
                multiline
                maxLength={500}
                placeholderTextColor={Colors.textSecondary}
              />
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
          </SafeAreaView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
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
    paddingTop: Spacing.md,
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
    paddingTop: Spacing.sm,
    paddingBottom: Platform.OS === "android" ? Spacing.md : 0,
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
    paddingBottom: Platform.OS === "android" ? Spacing.md : Spacing.sm,
    gap: Spacing.sm,
  },
  commentInput: {
    flex: 1,
    maxHeight: 100,
    minHeight: 40,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    backgroundColor: Colors.backgroundSecondary,
    color: Colors.text,
    fontSize: 14,
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
});
