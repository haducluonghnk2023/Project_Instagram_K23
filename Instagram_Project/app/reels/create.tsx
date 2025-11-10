import { Button, Input } from "@/components/common";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { Colors } from "@/constants/colors";
import { CommonStyles, Spacing, FontSizes } from "@/constants/styles";
import { LIMITS } from "@/constants/limits";
import { useCreatePost } from "@/hooks/usePost";
import { uploadVideoApi } from "@/services/upload.api";
import { showVideoPickerOptions, pickVideoFromLibrary, takeVideoFromCamera } from "@/utils/imagePicker";
import { compressVideo } from "@/utils/videoCompressor";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
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

export default function CreateReelScreen() {
  const { mutate: createPost, isPending } = useCreatePost();
  const [content, setContent] = useState("");
  const [videoUri, setVideoUri] = useState<string | null>(null);
  // Chỉ lưu URI local, không upload ngay
  const [isUploading, setIsUploading] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [visibility, setVisibility] = useState<"public" | "private" | "friends">("public");
  const { showToast } = useToast();

  const handleSelectVideo = async () => {
    try {
      showVideoPickerOptions(
        async () => {
          try {
            // Pass MAX_REEL_DURATION to limit video duration
            const result = await pickVideoFromLibrary(LIMITS.MAX_REEL_DURATION);
            if (!result.cancelled && result.uri) {
              setVideoUri(result.uri);
            }
          } catch (error: any) {
            console.error('Error picking video from library:', error);
            const { message } = showErrorFromException(error, 'Không thể chọn video từ thư viện');
            showToast(message, "error");
          }
        },
        async () => {
          try {
            // Pass MAX_REEL_DURATION to limit video duration
            const result = await takeVideoFromCamera(LIMITS.MAX_REEL_DURATION);
            if (!result.cancelled && result.uri) {
              setVideoUri(result.uri);
            }
          } catch (error: any) {
            console.error('Error taking video from camera:', error);
            const { message } = showErrorFromException(error, 'Không thể quay video');
            showToast(message, "error");
          }
        }
      );
    } catch (error: any) {
      console.error('Error in handleSelectVideo:', error);
      const { message } = showErrorFromException(error, 'Không thể mở video picker');
      showToast(message, "error");
    }
  };

  const handleRemoveVideo = () => {
    setVideoUri(null);
  };

  const handleSubmit = async () => {
    if (!videoUri) {
      showToast("Vui lòng chọn video để đăng Reel", "error");
      return;
    }

    setIsUploading(true);
    setStatusMessage("Chuẩn bị video...");
    setUploadProgress(0);
    
    try {
      // Video sẽ được nén tự động trên Cloudinary server
      // Không cần nén trên client với Expo Go
      // Chỉ hiển thị progress để UX tốt hơn
      setIsCompressing(true);
      setCompressionProgress(0);
      setStatusMessage("Chuẩn bị video...");
      
      // Simulate preparation progress (vì không có nén thực sự)
      await compressVideo(videoUri, {
        getProgress: (progress) => {
          setCompressionProgress(progress);
          setStatusMessage(`Chuẩn bị video... ${progress}%`);
        },
      });

      setIsCompressing(false);
      setCompressionProgress(100);
      setStatusMessage("Đang upload video...");
      setUploadProgress(0);

      // Upload video khi submit (Cloudinary sẽ tự động nén)
      const uploadedUrl = await uploadVideoApi(videoUri, "instagram/posts");
      setStatusMessage("Upload thành công!");
      setUploadProgress(100);

      createPost(
        {
          content: content.trim(),
          visibility,
          mediaUrls: [uploadedUrl],
        },
        {
          onSuccess: () => {
            showToast("Đã đăng Reel!", "success");
            setTimeout(() => {
              router.replace("/(tabs)/reels");
            }, 500);
          },
          onError: (error: any) => {
            const { message } = showErrorFromException(error, "Không thể đăng Reel");
            showToast(message, "error");
          },
        }
      );
      
      // Reset progress after a short delay
      setTimeout(() => {
        setStatusMessage("");
        setCompressionProgress(0);
        setUploadProgress(0);
      }, 1000);
      
    } catch (error: any) {
      setIsCompressing(false);
      setCompressionProgress(0);
      setUploadProgress(0);
      setStatusMessage("");
      
      let errorMessage = error?.response?.data?.data || error?.message || "Không thể xử lý video";
      
      // Improve error message for size/duration limits
      if (errorMessage.includes("Maximum upload size") || errorMessage.includes("Kích thước")) {
        errorMessage = `Video quá lớn. Kích thước tối đa: ${LIMITS.MAX_VIDEO_SIZE / (1024 * 1024)}MB, Độ dài tối đa: ${LIMITS.MAX_REEL_DURATION / 1000} giây. Video sẽ được nén tự động trên server.`;
      }
      
      showToast(errorMessage, "error");
    } finally {
      setIsUploading(false);
      setIsCompressing(false);
    }
  };

  return (
    <ThemedView style={CommonStyles.container}>
      <SafeAreaView edges={["top"]} style={CommonStyles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <ThemedText type="title" style={styles.headerTitle}>
            Tạo Reel
          </ThemedText>
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isPending || !videoUri || isUploading || isCompressing}
            style={styles.shareButton}
          >
            {isPending ? (
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

            {/* Video Section */}
            <View style={styles.videoSection}>
              {videoUri ? (
                <View style={styles.videoContainer}>
                  {!isUploading && !isCompressing && (
                    <Video
                      source={{ uri: videoUri }}
                      style={styles.video}
                      resizeMode={ResizeMode.COVER}
                      useNativeControls
                      isLooping
                      shouldPlay={false}
                      onError={(error) => {
                        console.error('Video playback error:', error);
                        Alert.alert('Lỗi', 'Không thể phát video. Vui lòng thử lại.');
                      }}
                    />
                  )}
                  {(isUploading || isCompressing) && (
                    <View style={styles.uploadingOverlay}>
                      <ActivityIndicator size="large" color={Colors.primary} />
                      <Text style={styles.uploadingText}>
                        {statusMessage || (isCompressing ? "Đang nén video..." : "Đang upload video...")}
                      </Text>
                      {/* Compression Progress */}
                      {isCompressing && compressionProgress > 0 && (
                        <View style={styles.progressContainer}>
                          <View style={styles.progressBar}>
                            <View 
                              style={[styles.progressFill, { width: `${compressionProgress}%` }]} 
                            />
                          </View>
                          <Text style={styles.progressText}>{compressionProgress}%</Text>
                        </View>
                      )}
                      {/* Upload Progress - Note: axios doesn't provide upload progress by default */}
                      {isUploading && !isCompressing && (
                        <View style={styles.progressContainer}>
                          <View style={styles.progressBar}>
                            <View 
                              style={[styles.progressFill, { width: "100%" }]} 
                            />
                          </View>
                        </View>
                      )}
                    </View>
                  )}
                  {!isUploading && !isCompressing && (
                    <TouchableOpacity
                      style={styles.removeVideoButton}
                      onPress={handleRemoveVideo}
                    >
                      <Ionicons name="close-circle" size={32} color={Colors.error} />
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.addVideoButton}
                  onPress={handleSelectVideo}
                  disabled={isUploading || isCompressing}
                >
                  <Ionicons name="videocam-outline" size={48} color={Colors.primary} />
                  <Text style={styles.addVideoText}>Chọn video</Text>
                  <Text style={styles.addVideoSubtext}>
                    Chọn video từ thư viện hoặc quay video mới
                  </Text>
                  <Text style={styles.addVideoLimitText}>
                    Tối đa {LIMITS.MAX_REEL_DURATION / 1000} giây, {LIMITS.MAX_VIDEO_SIZE / (1024 * 1024)}MB
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Content Input */}
            <View style={styles.contentSection}>
              <Input
                placeholder="Viết mô tả cho Reel..."
                value={content}
                onChangeText={setContent}
                multiline
                numberOfLines={4}
                style={styles.contentInput}
                maxLength={2200}
              />
              <Text style={styles.charCount}>{content.length}/2200</Text>
            </View>
          </ScrollView>
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
  videoSection: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
  },
  videoContainer: {
    position: "relative",
    width: "100%",
    aspectRatio: 9 / 16, // Vertical video format for Reels
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: Colors.backgroundDark,
  },
  video: {
    width: "100%",
    height: "100%",
  },
  uploadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.md,
  },
  uploadingText: {
    color: Colors.textLight,
    fontSize: FontSizes.md,
    fontWeight: "600",
    marginTop: Spacing.sm,
    textAlign: "center",
  },
  progressContainer: {
    width: "80%",
    marginTop: Spacing.md,
    alignItems: "center",
  },
  progressBar: {
    width: "100%",
    height: 8,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  progressText: {
    color: Colors.textLight,
    fontSize: FontSizes.sm,
    marginTop: Spacing.xs,
    fontWeight: "600",
  },
  removeVideoButton: {
    position: "absolute",
    top: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 16,
  },
  addVideoButton: {
    width: "100%",
    aspectRatio: 9 / 16,
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: "dashed",
    borderRadius: 12,
    backgroundColor: Colors.backgroundSecondary,
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.sm,
    padding: Spacing.lg,
  },
  addVideoText: {
    fontSize: FontSizes.lg,
    color: Colors.primary,
    fontWeight: "600",
  },
  addVideoSubtext: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  addVideoLimitText: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    textAlign: "center",
    marginTop: Spacing.xs,
    fontStyle: "italic",
  },
  contentSection: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
  },
  contentInput: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  charCount: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    textAlign: "right",
    marginTop: Spacing.xs,
  },
});

