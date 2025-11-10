import { Button, Input } from "@/components/common";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { Colors } from "@/constants/colors";
import { CommonStyles, Spacing, FontSizes } from "@/constants/styles";
import { useCreatePost } from "@/hooks/usePost";
import { uploadImageApi, uploadVideoApi } from "@/services/upload.api";
import { showImagePickerOptions, pickImageFromLibrary, pickMultipleImagesFromLibrary, takePhotoFromCamera, showMediaPickerOptions, pickVideoFromLibrary, takeVideoFromCamera, showVideoPickerOptions } from "@/utils/imagePicker";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Video, ResizeMode } from "expo-av";
import { useToast } from "@/components/common/ToastProvider";
import { showErrorFromException } from "@/utils/toast";
import { SwipeBackView } from "@/components/common";

export default function CreatePostScreen() {
  const { mutate: createPost, isPending } = useCreatePost();
  const [content, setContent] = useState("");
  // Chỉ lưu URI local, không upload ngay
  const [media, setMedia] = useState<Array<{ uri: string; type: 'image' | 'video' }>>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [visibility, setVisibility] = useState<"public" | "private" | "friends">("public");
  const { showToast } = useToast();

  const handleSelectMedia = async () => {
    showMediaPickerOptions(
      async () => {
        // Chọn ảnh - cho phép chọn nhiều ảnh từ thư viện
        showImagePickerOptions(
          async () => {
            // Tính số ảnh còn có thể chọn
            const remainingSlots = 10 - media.length;
            if (remainingSlots <= 0) {
              showToast("Đã đạt tối đa 10 file", "error");
              return;
            }
            
            const result = await pickMultipleImagesFromLibrary(remainingSlots);
            if (!result.cancelled && result.uris.length > 0) {
              // Chỉ lưu URI local, không upload ngay
              handleMultipleMediaSelected(result.uris, 'image');
            }
          },
          async () => {
            // Chụp ảnh từ camera (chỉ 1 ảnh)
            const result = await takePhotoFromCamera();
            if (!result.cancelled && result.uri) {
              handleMediaSelected(result.uri, 'image');
            }
          }
        );
      },
      async () => {
        // Chọn video
        showVideoPickerOptions(
          async () => {
            const result = await pickVideoFromLibrary();
            if (!result.cancelled && result.uri) {
              handleMediaSelected(result.uri, 'video');
            }
          },
          async () => {
            const result = await takeVideoFromCamera();
            if (!result.cancelled && result.uri) {
              handleMediaSelected(result.uri, 'video');
            }
          }
        );
      }
    );
  };

  const handleMediaSelected = (uri: string, type: 'image' | 'video') => {
    if (media.length >= 10) {
      showToast("Tối đa 10 file", "error");
      return;
    }

    // Chỉ lưu URI local, không upload ngay
    setMedia((prev) => [...prev, { uri, type }]);
  };

  const handleMultipleMediaSelected = (uris: string[], type: 'image' | 'video') => {
    const remainingSlots = 10 - media.length;
    if (remainingSlots <= 0) {
      showToast("Đã đạt tối đa 10 file", "error");
      return;
    }

    // Chỉ lấy số lượng ảnh còn có thể chọn
    const urisToAdd = uris.slice(0, remainingSlots);
    
    // Chỉ lưu URI local, không upload ngay
    setMedia((prev) => [...prev, ...urisToAdd.map(uri => ({ uri, type }))]);
  };

  const handleRemoveMedia = (index: number) => {
    setMedia((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!content.trim() && media.length === 0) {
      showToast("Vui lòng nhập nội dung hoặc thêm ảnh/video", "error");
      return;
    }

    setIsUploading(true);
    
    try {
      let mediaUrls: string[] | undefined;
      let mediaTypes: ('image' | 'video')[] | undefined;

      // Upload tất cả media khi submit
      if (media.length > 0) {
        showToast("Đang upload ảnh/video...", "info");
        
        // Upload tất cả media song song
        const uploadPromises = media.map(async (item) => {
          try {
            const uploadedUrl = item.type === 'image' 
              ? await uploadImageApi(item.uri, "instagram/posts")
              : await uploadVideoApi(item.uri, "instagram/posts");
            
            if (!uploadedUrl) {
              throw new Error(`Không nhận được URL sau khi upload ${item.type === 'image' ? 'ảnh' : 'video'}`);
            }
            
            return { url: uploadedUrl, type: item.type };
          } catch (error: unknown) {
            console.error(`Upload ${item.type} error:`, error);
            const { getErrorMessage } = require('@/utils/error');
            const errorMessage = getErrorMessage(error);
            throw new Error(errorMessage || `Không thể upload ${item.type === 'image' ? 'ảnh' : 'video'}`);
          }
        });

        const uploadResults = await Promise.all(uploadPromises);
        mediaUrls = uploadResults.map(r => r.url);
        mediaTypes = uploadResults.map(r => r.type);
      }

      // Tạo post với URLs đã upload
      createPost(
        {
          content: content.trim() || undefined,
          visibility,
          mediaUrls,
          mediaTypes,
        },
        {
          onSuccess: async () => {
            showToast("Đã đăng bài viết!", "success");
            // Đợi một chút để cache được update
            await new Promise(resolve => setTimeout(resolve, 100));
            // Navigate về home
            // Cache đã được update, query sẽ tự động hiển thị post mới
            router.replace("/(tabs)/home");
          },
          onError: (error: any) => {
            const { message } = showErrorFromException(error, "Không thể đăng bài viết");
            showToast(message, "error");
          },
        }
      );
    } catch (error: any) {
      const { message } = showErrorFromException(error, "Không thể upload media");
      showToast(message, "error");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <SwipeBackView enabled={true} style={CommonStyles.container}>
      <ThemedView style={CommonStyles.container}>
      <SafeAreaView edges={["top"]} style={CommonStyles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.replace("/(tabs)/home")} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <ThemedText type="title" style={styles.headerTitle}>
            Tạo bài viết
          </ThemedText>
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isPending || isUploading}
            style={styles.shareButton}
          >
            {(isPending || isUploading) ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <Text style={styles.shareButtonText}>Chia sẻ</Text>
            )}
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={CommonStyles.container}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* User Info */}
            <View style={styles.userInfo}>
              <View style={styles.userAvatar}>
                <Ionicons name="person" size={24} color={Colors.textSecondary} />
              </View>
              <View style={styles.visibilitySelector}>
                <TouchableOpacity
                  style={[
                    styles.visibilityOption,
                    visibility === "public" && styles.visibilityOptionActive,
                  ]}
                  onPress={() => setVisibility("public")}
                >
                  <Ionicons
                    name="globe-outline"
                    size={16}
                    color={visibility === "public" ? Colors.primary : Colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.visibilityText,
                      visibility === "public" && styles.visibilityTextActive,
                    ]}
                  >
                    Công khai
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.visibilityOption,
                    visibility === "friends" && styles.visibilityOptionActive,
                  ]}
                  onPress={() => setVisibility("friends")}
                >
                  <Ionicons
                    name="people-outline"
                    size={16}
                    color={visibility === "friends" ? Colors.primary : Colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.visibilityText,
                      visibility === "friends" && styles.visibilityTextActive,
                    ]}
                  >
                    Bạn bè
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.visibilityOption,
                    visibility === "private" && styles.visibilityOptionActive,
                  ]}
                  onPress={() => setVisibility("private")}
                >
                  <Ionicons
                    name="lock-closed-outline"
                    size={16}
                    color={visibility === "private" ? Colors.primary : Colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.visibilityText,
                      visibility === "private" && styles.visibilityTextActive,
                    ]}
                  >
                    Riêng tư
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Content Input */}
            <View style={styles.contentSection}>
              <Input
                placeholder="Viết gì đó..."
                value={content}
                onChangeText={setContent}
                multiline
                numberOfLines={8}
                style={styles.contentInput}
                maxLength={2200}
              />
              <Text style={styles.charCount}>{content.length}/2200</Text>
            </View>

            {/* Media Section */}
            <View style={styles.mediaSection}>
              {media.length > 0 && (
                <View style={styles.mediaGrid}>
                  {media.map((item, index) => (
                    <View key={index} style={styles.mediaContainer}>
                      {item.type === 'image' ? (
                        <Image source={{ uri: item.uri }} style={styles.mediaItem} />
                      ) : (
                        <Video
                          source={{ uri: item.uri }}
                          style={styles.mediaItem}
                          resizeMode={ResizeMode.COVER}
                          shouldPlay={false}
                          useNativeControls={false}
                        />
                      )}
                      <View style={styles.mediaTypeBadge}>
                        <Ionicons 
                          name={item.type === 'image' ? 'image' : 'videocam'} 
                          size={16} 
                          color="#fff" 
                        />
                      </View>
                      <TouchableOpacity
                        style={styles.removeMediaButton}
                        onPress={() => handleRemoveMedia(index)}
                      >
                        <Ionicons name="close-circle" size={24} color={Colors.error} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              <TouchableOpacity
                style={styles.addMediaButton}
                onPress={handleSelectMedia}
                disabled={media.length >= 10 || isUploading || isPending}
              >
                <Ionicons name="add-circle-outline" size={32} color={Colors.primary} />
                <Text style={styles.addMediaText}>
                  {media.length >= 10 ? "Đã đạt tối đa 10 file" : "Thêm ảnh/video"}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
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
    fontSize: FontSizes.lg,
    fontWeight: "600",
    flex: 1,
    textAlign: "center",
  },
  shareButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  shareButtonText: {
    fontSize: FontSizes.md,
    fontWeight: "600",
    color: Colors.primary,
  },
  scrollContent: {
    paddingBottom: Spacing.xl,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.backgroundSecondary,
    justifyContent: "center",
    alignItems: "center",
  },
  visibilitySelector: {
    flexDirection: "row",
    gap: Spacing.sm,
    flex: 1,
  },
  visibilityOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  visibilityOptionActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  visibilityText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  visibilityTextActive: {
    color: Colors.primary,
    fontWeight: "600",
  },
  contentSection: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
  },
  contentInput: {
    minHeight: 150,
    textAlignVertical: "top",
  },
  charCount: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    textAlign: "right",
    marginTop: Spacing.xs,
  },
  mediaSection: {
    paddingHorizontal: Spacing.md,
  },
  mediaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  mediaContainer: {
    position: "relative",
    width: "48%",
    aspectRatio: 1,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: Colors.backgroundDark,
  },
  mediaItem: {
    width: "100%",
    height: "100%",
  },
  mediaTypeBadge: {
    position: "absolute",
    top: Spacing.xs,
    left: Spacing.xs,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderRadius: 12,
    padding: Spacing.xs,
  },
  removeMediaButton: {
    position: "absolute",
    top: Spacing.xs,
    right: Spacing.xs,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 12,
  },
  uploadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  uploadingText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  addMediaButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: "dashed",
    borderRadius: 8,
    backgroundColor: Colors.backgroundSecondary,
  },
  addMediaText: {
    fontSize: FontSizes.md,
    color: Colors.primary,
    fontWeight: "600",
  },
});
