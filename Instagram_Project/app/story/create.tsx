import { Button, Input } from "@/components/common";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { Colors } from "@/constants/colors";
import { CommonStyles, Spacing, FontSizes } from "@/constants/styles";
import { LIMITS } from "@/constants/limits";
import { useCreatePost } from "@/hooks/usePost";
import { uploadImageApi, uploadVideoApi } from "@/services/upload.api";
import { showMediaPickerOptions, pickImageFromLibrary, takePhotoFromCamera, pickVideoFromLibrary, takeVideoFromCamera, showVideoPickerOptions, showImagePickerOptions } from "@/utils/imagePicker";
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
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Video, ResizeMode } from "expo-av";
import { useToast } from "@/components/common/ToastProvider";
import { showErrorFromException } from "@/utils/toast";

export default function CreateStoryScreen() {
  const { mutate: createPost, isPending } = useCreatePost();
  const [content, setContent] = useState("");
  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video" | null>(null);
  // Chỉ lưu URI local, không upload ngay
  const [isUploading, setIsUploading] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const { showToast } = useToast();

  const handleSelectMedia = async () => {
    try {
      showMediaPickerOptions(
        async () => {
          // Chọn ảnh
          showImagePickerOptions(
            async () => {
              try {
                const result = await pickImageFromLibrary();
                if (!result.cancelled && result.uri) {
                  setMediaUri(result.uri);
                  setMediaType("image");
                }
              } catch (error: any) {
                console.error('Error picking image:', error);
                const { message } = showErrorFromException(error, 'Không thể chọn ảnh');
                showToast(message, "error");
              }
            },
            async () => {
              try {
                const result = await takePhotoFromCamera();
                if (!result.cancelled && result.uri) {
                  setMediaUri(result.uri);
                  setMediaType("image");
                }
              } catch (error: any) {
                console.error('Error taking photo:', error);
                const { message } = showErrorFromException(error, 'Không thể chụp ảnh');
                showToast(message, "error");
              }
            }
          );
        },
        async () => {
          // Chọn video (Story: tối đa 15 giây)
          showVideoPickerOptions(
            async () => {
              try {
                const result = await pickVideoFromLibrary(LIMITS.MAX_STORY_DURATION);
                if (!result.cancelled && result.uri) {
                  setMediaUri(result.uri);
                  setMediaType("video");
                }
              } catch (error: any) {
                console.error('Error picking video:', error);
                const { message } = showErrorFromException(error, 'Không thể chọn video');
                showToast(message, "error");
              }
            },
            async () => {
              try {
                const result = await takeVideoFromCamera(LIMITS.MAX_STORY_DURATION);
                if (!result.cancelled && result.uri) {
                  setMediaUri(result.uri);
                  setMediaType("video");
                }
              } catch (error: any) {
                console.error('Error taking video:', error);
                const { message } = showErrorFromException(error, 'Không thể quay video');
                showToast(message, "error");
              }
            }
          );
        }
      );
    } catch (error: any) {
      console.error('Error in handleSelectMedia:', error);
      const { message } = showErrorFromException(error, 'Không thể mở media picker');
      showToast(message, "error");
    }
  };

  const handleRemoveMedia = () => {
    setMediaUri(null);
    setMediaType(null);
  };

  const handleSubmit = async () => {
    if (!mediaUri || !mediaType) {
      showToast("Vui lòng chọn ảnh hoặc video để đăng Story", "error");
      return;
    }

    setIsUploading(true);
    setStatusMessage("Chuẩn bị media...");
    
    try {
      let uploadedUrl: string;
      
      if (mediaType === "video") {
        // Nén video cho Story (tối ưu hơn vì Story ngắn)
        setIsCompressing(true);
        setCompressionProgress(0);
        setStatusMessage("Đang xử lý video...");
        
        await compressVideo(mediaUri, {
          getProgress: (progress) => {
            setCompressionProgress(progress);
            setStatusMessage(`Đang xử lý video... ${progress}%`);
          },
          maxSize: LIMITS.MAX_STORY_SIZE,
        });

        setIsCompressing(false);
        setCompressionProgress(100);
      }

      setStatusMessage("Đang upload...");
      
      // Upload media khi submit
      uploadedUrl = mediaType === "image"
        ? await uploadImageApi(mediaUri, "instagram/stories")
        : await uploadVideoApi(mediaUri, "instagram/stories");
      
      setStatusMessage("Upload thành công!");
      
      // Story: có video và có thể có content (khác với Reel)
      createPost(
        {
          content: content.trim() || undefined,
          visibility: "public", // Story luôn public
          mediaUrls: [uploadedUrl],
          mediaTypes: [mediaType],
        },
        {
          onSuccess: () => {
            showToast("Đã đăng Story!", "success");
            setTimeout(() => {
              router.replace("/(tabs)/home");
            }, 500);
          },
          onError: (error: any) => {
            const { message } = showErrorFromException(error, "Không thể đăng Story");
            showToast(message, "error");
          },
        }
      );
      
      // Reset progress after a short delay
      setTimeout(() => {
        setStatusMessage("");
        setCompressionProgress(0);
      }, 1000);
      
    } catch (error: any) {
      setIsCompressing(false);
      setCompressionProgress(0);
      setStatusMessage("");
      
      let errorMessage = error?.response?.data?.data || error?.message || "Không thể xử lý media";
      
      // Improve error message
      if (errorMessage.includes("Maximum upload size") || errorMessage.includes("Kích thước")) {
        errorMessage = `Media quá lớn. Kích thước tối đa: ${mediaType === "video" ? LIMITS.MAX_STORY_SIZE / (1024 * 1024) : LIMITS.MAX_IMAGE_SIZE / (1024 * 1024)}MB${mediaType === "video" ? `, Độ dài tối đa: ${LIMITS.MAX_STORY_DURATION / 1000} giây` : ""}. Media sẽ được nén tự động trên server.`;
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
            Tạo Story
          </ThemedText>
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isPending || !mediaUri || isUploading || isCompressing}
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
            {/* Media Section */}
            <View style={styles.mediaSection}>
              {mediaUri ? (
                <View style={styles.mediaContainer}>
                  {mediaType === "image" ? (
                    <>
                      <Image source={{ uri: mediaUri }} style={styles.media} />
                      {(isUploading || isCompressing) && (
                        <View style={styles.processingOverlay}>
                          <ActivityIndicator size="large" color={Colors.primary} />
                          <Text style={styles.processingText}>
                            {statusMessage || "Đang upload..."}
                          </Text>
                        </View>
                      )}
                    </>
                  ) : (
                    <>
                      <Video
                        source={{ uri: mediaUri }}
                        style={styles.media}
                        resizeMode={ResizeMode.COVER}
                        useNativeControls
                        isLooping
                        shouldPlay={false}
                        onError={(error) => {
                          console.error('Video playback error:', error);
                          Alert.alert('Lỗi', 'Không thể phát video. Vui lòng thử lại.');
                        }}
                      />
                      {(isUploading || isCompressing) && (
                        <View style={styles.processingOverlay}>
                          <ActivityIndicator size="large" color={Colors.primary} />
                          <Text style={styles.processingText}>
                            {statusMessage || (isCompressing ? "Đang xử lý video..." : "Đang upload...")}
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
                        </View>
                      )}
                    </>
                  )}
                  {!isUploading && !isCompressing && (
                    <TouchableOpacity
                      style={styles.removeMediaButton}
                      onPress={handleRemoveMedia}
                    >
                      <Ionicons name="close-circle" size={32} color={Colors.error} />
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.addMediaButton}
                  onPress={handleSelectMedia}
                  disabled={isUploading || isCompressing}
                >
                  <Ionicons name="camera-outline" size={48} color={Colors.primary} />
                  <Text style={styles.addMediaText}>Chọn ảnh hoặc video</Text>
                  <Text style={styles.addMediaSubtext}>
                    Chọn từ thư viện hoặc chụp/quay mới
                  </Text>
                  <Text style={styles.addMediaLimitText}>
                    Video: tối đa {LIMITS.MAX_STORY_DURATION / 1000} giây, {LIMITS.MAX_STORY_SIZE / (1024 * 1024)}MB
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Content Input */}
            <View style={styles.contentSection}>
              <Input
                placeholder="Thêm chú thích cho Story (tùy chọn)..."
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
  mediaSection: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
  },
  mediaContainer: {
    position: "relative",
    width: "100%",
    aspectRatio: 9 / 16, // Vertical format for Story
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: Colors.backgroundDark,
  },
  media: {
    width: "100%",
    height: "100%",
  },
  processingOverlay: {
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
  processingText: {
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
  removeMediaButton: {
    position: "absolute",
    top: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 16,
  },
  addMediaButton: {
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
  addMediaText: {
    fontSize: FontSizes.lg,
    color: Colors.primary,
    fontWeight: "600",
  },
  addMediaSubtext: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  addMediaLimitText: {
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

