import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  Image,
  Alert,
  Modal,
  Dimensions,
} from "react-native";
import { Video, ResizeMode } from "expo-av";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { ThemedView } from "@/components/themed-view";
import { Avatar } from "@/components/common/Avatar";
import { Colors } from "@/constants/colors";
import { Spacing, FontSizes } from "@/constants/styles";
import {
  useConversation,
  useSendMessage,
  useMarkAllAsRead,
  useDeleteMessage,
} from "@/hooks/useMessage";
import {
  useReactToMessage,
  useRemoveReaction,
} from "@/hooks/useMessageReaction";
import { useWebSocket } from "@/hooks/useWebSocket";
import { Message } from "@/types/message";
import { router, useLocalSearchParams } from "expo-router";
import { SwipeBackView, useToast } from "@/components/common";
import { useMe } from "@/hooks/useAuth";
import { uploadImageApi, uploadVideoApi } from "@/services/upload.api";
import { getErrorMessage } from "@/utils/error";
import { logger } from "@/utils/logger";
import {
  showImagePickerOptions,
  pickImageFromLibrary,
  takePhotoFromCamera,
  showMediaPickerOptions,
  showVideoPickerOptions,
  pickVideoFromLibrary,
  takeVideoFromCamera,
} from "@/utils/imagePicker";

const EMOJI_OPTIONS = ["❤️", "👍", "😄", "😮", "😢", "🙏"];

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  onReactionPress: (messageId: string) => void;
  onReactionLongPress: (messageId: string, emoji: string) => void;
  onDeletePress?: (messageId: string) => void;
  videoRefs: React.MutableRefObject<Map<string, any>>;
  onVideoPress: (videoUrl: string) => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwn,
  onReactionPress,
  onReactionLongPress,
  onDeletePress,
  videoRefs,
  onVideoPress,
}) => {
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <View
      style={[styles.messageContainer, isOwn && styles.messageContainerOwn]}
    >
      {!isOwn && (
        <Avatar
          source={message.fromUser.profile?.avatarUrl || null}
          size={32}
          showBorder={false}
          style={styles.messageAvatar}
        />
      )}
      <View style={[styles.messageBubble, isOwn && styles.messageBubbleOwn]}>
        {/* Read Status Indicator - Vòng tròn nhỏ ở góc */}
        {isOwn && (
          <View style={styles.readStatusIndicator}>
            <View
              style={[
                styles.readStatusDot,
                message.isRead && styles.readStatusDotRead,
              ]}
            />
          </View>
        )}

        {/* Media */}
        {message.media && message.media.length > 0 && (
          <View style={styles.messageMediaContainer}>
            {message.media.map((media, index) => (
              <TouchableOpacity
                key={media.id}
                style={styles.messageMediaItem}
                onPress={() => {
                  if (media.mediaType === "video") {
                    onVideoPress(media.mediaUrl);
                  }
                }}
                activeOpacity={media.mediaType === "video" ? 0.7 : 1}
              >
                {media.mediaType === "video" ? (
                  <View style={styles.videoContainer}>
                    <Video
                      ref={(ref) => {
                        if (ref) {
                          videoRefs.current.set(media.id, ref);
                        }
                      }}
                      source={{ uri: media.mediaUrl }}
                      style={styles.messageVideo}
                      useNativeControls={false}
                      resizeMode={ResizeMode.COVER}
                      isLooping={false}
                      shouldPlay={false}
                    />
                    <View style={styles.videoOverlay}>
                      <Ionicons name="play-circle" size={40} color="#fff" />
                    </View>
                  </View>
                ) : (
                  <Image
                    source={{ uri: media.mediaUrl }}
                    style={styles.messageImage}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Content */}
        {message.content && (
          <Text style={[styles.messageText, isOwn && styles.messageTextOwn]}>
            {message.content}
          </Text>
        )}

        {/* Time and Read Status */}
        <View style={styles.messageFooter}>
          <Text style={[styles.messageTime, isOwn && styles.messageTimeOwn]}>
            {formatTime(message.createdAt)}
          </Text>
          {isOwn && (
            <Ionicons
              name={message.isRead ? "checkmark-done" : "checkmark"}
              size={14}
              color={message.isRead ? Colors.primary : Colors.textSecondary}
              style={styles.readIcon}
            />
          )}
        </View>

        {/* Reactions */}
        {message.reactions && message.reactions.length > 0 && (
          <View style={styles.reactionsContainer}>
            {message.reactions.map((reaction) => (
              <TouchableOpacity
                key={reaction.id}
                style={styles.reactionBadge}
                onPress={() => onReactionLongPress(message.id, reaction.emoji)}
              >
                <Text style={styles.reactionEmoji}>{reaction.emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Reaction Button */}
      <TouchableOpacity
        style={styles.reactionButton}
        onPress={() => onReactionPress(message.id)}
        onLongPress={() => {
          // Show emoji picker
        }}
      >
        <Ionicons name="add-outline" size={16} color={Colors.textSecondary} />
      </TouchableOpacity>

      {/* Delete Button - chỉ hiển thị cho tin nhắn của chính mình */}
      {isOwn && onDeletePress && (
        <TouchableOpacity
          style={styles.deleteMessageButton}
          onPress={() => onDeletePress(message.id)}
        >
          <Ionicons name="trash-outline" size={16} color={Colors.error} />
        </TouchableOpacity>
      )}
    </View>
  );
};

export default function ChatDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: currentUser } = useMe();
  const { data: messages, isLoading, refetch } = useConversation(id as string);
  const { mutate: sendMessage, isPending: isSending } = useSendMessage();
  const { mutate: markAllAsRead } = useMarkAllAsRead();
  const { mutate: reactToMessage } = useReactToMessage();
  const { mutate: removeReaction } = useRemoveReaction();
  const { mutate: deleteMessage } = useDeleteMessage();
  const { showToast } = useToast();

  const [messageText, setMessageText] = useState("");
  // Chỉ lưu URI local, không upload ngay
  const [selectedImageUris, setSelectedImageUris] = useState<string[]>([]);
  const [selectedVideoUris, setSelectedVideoUris] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  // Track các media đang upload với status
  const [uploadingMedia, setUploadingMedia] = useState<Map<string, { type: 'image' | 'video', status: 'uploading' | 'success' | 'error' }>>(new Map());
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedMessageForReaction, setSelectedMessageForReaction] = useState<
    string | null
  >(null);
  const [selectedVideoForPlayback, setSelectedVideoForPlayback] = useState<
    string | null
  >(null);
  const flatListRef = useRef<FlatList>(null);
  const videoRefs = useRef<Map<string, any>>(new Map());

  // Enable WebSocket for real-time updates
  useWebSocket(true);

  // Xử lý trường hợp tự nhắn tin (self-messaging)
  const otherUser =
    messages && messages.length > 0
      ? messages[0].fromUserId === currentUser?.id
        ? messages[0].toUser
        : messages[0].fromUser
      : null;
  // Nếu tự nhắn tin, hiển thị thông tin của chính mình
  const isSelfChat = id === currentUser?.id;
  const displayName = isSelfChat
    ? currentUser?.profile?.fullName || currentUser?.email || "Ghi chú của tôi"
    : otherUser?.profile?.fullName || otherUser?.email || "Người dùng";
  const avatarUrl = isSelfChat
    ? currentUser?.profile?.avatarUrl || null
    : otherUser?.profile?.avatarUrl || null;

  useEffect(() => {
    if (id && currentUser?.id) {
      markAllAsRead(id as string);
    }
  }, [id, currentUser?.id]);

  useEffect(() => {
    if (messages && messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const handleSelectMedia = () => {
    showMediaPickerOptions(
      () => {
        // Chọn ảnh
        showImagePickerOptions(
          async () => {
            const result = await pickImageFromLibrary();
            if (!result.cancelled && result.uri) {
              handleImageSelected(result.uri);
            }
          },
          async () => {
            const result = await takePhotoFromCamera();
            if (!result.cancelled && result.uri) {
              handleImageSelected(result.uri);
            }
          }
        );
      },
      () => {
        // Chọn video
        showVideoPickerOptions(
          async () => {
            const result = await pickVideoFromLibrary();
            if (!result.cancelled && result.uri) {
              handleVideoSelected(result.uri);
            }
          },
          async () => {
            const result = await takeVideoFromCamera();
            if (!result.cancelled && result.uri) {
              handleVideoSelected(result.uri);
            }
          }
        );
      }
    );
  };

  const handleImageSelected = (imageUri: string) => {
    if (selectedImageUris.length >= 5) {
      showToast("Tối đa 5 ảnh", "error");
      return;
    }

    // Chỉ lưu URI local, không upload ngay
    setSelectedImageUris((prev) => [...prev, imageUri]);
  };

  const handleVideoSelected = (videoUri: string) => {
    if (selectedVideoUris.length >= 3) {
      showToast("Tối đa 3 video", "error");
      return;
    }

    // Chỉ lưu URI local, không upload ngay
    setSelectedVideoUris((prev) => [...prev, videoUri]);
  };

  const handleRemoveImage = (index: number) => {
    setSelectedImageUris((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveVideo = (index: number) => {
    setSelectedVideoUris((prev) => prev.filter((_, i) => i !== index));
  };

  // Helper function để upload với timeout
  const uploadWithTimeout = async (
    uploadFn: () => Promise<string>,
    timeoutMs: number = 30000
  ): Promise<string> => {
    return Promise.race([
      uploadFn(),
      new Promise<string>((_, reject) => {
        setTimeout(() => {
          reject(new Error("Upload quá thời gian. Vui lòng thử lại."));
        }, timeoutMs);
      }),
    ]);
  };

  const handleSendMessage = async () => {
    const hasText = messageText.trim().length > 0;
    const hasMedia =
      selectedImageUris.length > 0 || selectedVideoUris.length > 0;

    if (!hasText && !hasMedia) {
      return;
    }

    // Nếu chỉ có text, gửi ngay không cần upload
    if (hasText && !hasMedia) {
      const payload = {
        toUserId: id as string,
        content: messageText.trim(),
      };

      sendMessage(payload, {
        onSuccess: () => {
          setMessageText("");
          refetch();
        },
        onError: (error: unknown) => {
          logger.error("Send message error:", error);
          const errorMessage = getErrorMessage(error);
          showToast(errorMessage, "error");
        },
      });
      return;
    }

    // Nếu có media, upload background và cho phép gửi tin nhắn khác
    if (hasMedia) {
      setIsUploading(true);

      // Lưu media và message để upload
      const tempImageUris = [...selectedImageUris];
      const tempVideoUris = [...selectedVideoUris];
      const tempMessageText = messageText.trim();
      
      // Đánh dấu tất cả media là đang upload
      const newUploadingMedia = new Map<string, { type: 'image' | 'video', status: 'uploading' | 'success' | 'error' }>();
      tempImageUris.forEach(uri => {
        newUploadingMedia.set(uri, { type: 'image', status: 'uploading' });
      });
      tempVideoUris.forEach(uri => {
        newUploadingMedia.set(uri, { type: 'video', status: 'uploading' });
      });
      setUploadingMedia(newUploadingMedia);
      
      // Clear input để có thể gửi tin nhắn khác
      setSelectedImageUris([]);
      setSelectedVideoUris([]);
      setMessageText("");

      // Upload background (không block UI)
      (async () => {
        try {
          const uploadedImageUrls: string[] = [];
          const uploadedVideoUrls: string[] = [];

          // Upload images với timeout
          if (tempImageUris.length > 0) {
            const imageUploadPromises = tempImageUris.map(async (uri) => {
              try {
                const url = await uploadWithTimeout(
                  () => uploadImageApi(uri, "instagram/messages"),
                  30000 // 30 seconds timeout
                );
                // Update status thành success
                setUploadingMedia(prev => {
                  const newMap = new Map(prev);
                  newMap.set(uri, { type: 'image', status: 'success' });
                  return newMap;
                });
                return url;
              } catch (error: unknown) {
                const errorMsg = getErrorMessage(error);
                // Update status thành error
                setUploadingMedia(prev => {
                  const newMap = new Map(prev);
                  newMap.set(uri, { type: 'image', status: 'error' });
                  return newMap;
                });
                if (
                  errorMsg.includes("thời gian") ||
                  errorMsg.includes("timeout")
                ) {
                  showToast(
                    "Upload ảnh quá thời gian. Vui lòng thử lại.",
                    "error"
                  );
                } else {
                  showToast(errorMsg || "Không thể upload ảnh", "error");
                }
                return null;
              }
            });
            const results = await Promise.all(imageUploadPromises);
            uploadedImageUrls.push(
              ...results.filter((url): url is string => url !== null)
            );
          }

          // Upload videos với timeout (tăng lên 120 giây vì uploadVideoApi đã có timeout riêng)
          if (tempVideoUris.length > 0) {
            const videoUploadPromises = tempVideoUris.map(async (uri) => {
              try {
                // uploadVideoApi đã có timeout 120s, nhưng vẫn dùng uploadWithTimeout để double check
                const url = await uploadWithTimeout(
                  () => uploadVideoApi(uri, "instagram/messages"),
                  130000 // 130 seconds timeout (lớn hơn 120s của uploadVideoApi)
                );
                
                // Log success
                logger.info("Video uploaded successfully:", url);
                
                // Update status thành success
                setUploadingMedia(prev => {
                  const newMap = new Map(prev);
                  newMap.set(uri, { type: 'video', status: 'success' });
                  return newMap;
                });
                return url;
              } catch (error: unknown) {
                // Log error chi tiết
                logger.error("Upload video error for URI:", uri, error);
                
                const errorMsg = getErrorMessage(error);
                
                // Update status thành error
                setUploadingMedia(prev => {
                  const newMap = new Map(prev);
                  newMap.set(uri, { type: 'video', status: 'error' });
                  return newMap;
                });
                
                // Chỉ hiển thị toast nếu không phải timeout (vì timeout đã được xử lý trong uploadVideoApi)
                if (
                  errorMsg.includes("thời gian") ||
                  errorMsg.includes("timeout")
                ) {
                  showToast(
                    "Upload video quá thời gian. Vui lòng thử lại với video nhỏ hơn.",
                    "error"
                  );
                } else {
                  // Log full error để debug
                  console.error("Full error object:", error);
                  showToast(errorMsg || "Không thể upload video", "error");
                }
                return null;
              }
            });
            const results = await Promise.all(videoUploadPromises);
            uploadedVideoUrls.push(
              ...results.filter((url): url is string => url !== null)
            );
          }

          // Build request payload
          const payload: any = {
            toUserId: id as string,
          };

          if (tempMessageText) {
            payload.content = tempMessageText;
          }

          // Combine images and videos
          const allMedia = [...uploadedImageUrls, ...uploadedVideoUrls];
          if (allMedia.length > 0) {
            payload.mediaUrls = allMedia;
          }

          // Chỉ gửi nếu có ít nhất text hoặc media đã upload thành công
          if (tempMessageText || allMedia.length > 0) {
            sendMessage(payload, {
              onSuccess: () => {
                refetch();
                // Remove uploaded media từ uploadingMedia sau khi gửi thành công
                setTimeout(() => {
                  setUploadingMedia(prev => {
                    const newMap = new Map(prev);
                    tempImageUris.forEach(uri => newMap.delete(uri));
                    tempVideoUris.forEach(uri => newMap.delete(uri));
                    return newMap;
                  });
                }, 500); // Delay một chút để user thấy success
              },
              onError: (error: unknown) => {
                logger.error("Send message error:", error);
                const errorMessage = getErrorMessage(error);
                showToast(errorMessage, "error");
              },
            });
          } else {
            showToast("Không thể upload media. Vui lòng thử lại.", "error");
            // Remove failed media
            setUploadingMedia(prev => {
              const newMap = new Map(prev);
              tempImageUris.forEach(uri => newMap.delete(uri));
              tempVideoUris.forEach(uri => newMap.delete(uri));
              return newMap;
            });
          }
        } catch (error: unknown) {
          const errorMessage = getErrorMessage(error);
          showToast(errorMessage, "error");
        } finally {
          setIsUploading(false);
        }
      })();
    }
  };

  const handleReactionPress = (messageId: string) => {
    setSelectedMessageForReaction(messageId);
    setShowEmojiPicker(true);
  };

  const handleEmojiSelect = (emoji: string) => {
    if (selectedMessageForReaction) {
      reactToMessage(
        {
          messageId: selectedMessageForReaction,
          data: { emoji },
        },
        {
          onSuccess: () => {
            refetch();
          },
        }
      );
    }
    setShowEmojiPicker(false);
    setSelectedMessageForReaction(null);
  };

  const handleReactionLongPress = (messageId: string, emoji: string) => {
    // Remove reaction if user already reacted with this emoji
    removeReaction(messageId, {
      onSuccess: () => {
        refetch();
      },
    });
  };

  const handleDeleteMessage = (messageId: string) => {
    Alert.alert(
      "Xóa tin nhắn",
      "Bạn có chắc chắn muốn xóa tin nhắn này?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: () => {
            deleteMessage(messageId, {
              onSuccess: () => {
                refetch();
                showToast("Đã xóa tin nhắn", "success");
              },
              onError: (error: unknown) => {
                logger.error("Delete message error:", error);
                const errorMessage = getErrorMessage(error);
                showToast(errorMessage, "error");
              },
            });
          },
        },
      ]
    );
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwn = item.fromUserId === currentUser?.id;
    return (
      <MessageBubble
        message={item}
        isOwn={isOwn}
        onReactionPress={handleReactionPress}
        onReactionLongPress={handleReactionLongPress}
        onDeletePress={handleDeleteMessage}
        videoRefs={videoRefs}
        onVideoPress={setSelectedVideoForPlayback}
      />
    );
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => {
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace("/(tabs)/messages");
                }
              }}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color={Colors.text} />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>{displayName}</Text>
            </View>
            <View style={styles.backButton} />
          </View>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        </SafeAreaView>
      </ThemedView>
    );
  }

  return (
    <SwipeBackView enabled={true} style={styles.container}>
      <ThemedView style={styles.container}>
        <SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => {
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace("/(tabs)/messages");
                }
              }}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color={Colors.text} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerCenter}
              onPress={() => router.push(`/profile?userId=${id}`)}
            >
              <Avatar source={avatarUrl} size={32} showBorder={false} />
              <Text style={styles.headerTitle}>{displayName}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.backButton}>
              <Ionicons name="call-outline" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={styles.keyboardView}
            keyboardVerticalOffset={0}
          >
            {/* Messages List */}
            <FlatList
              ref={flatListRef}
              data={messages || []}
              renderItem={renderMessage}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.messagesList}
              onContentSizeChange={() =>
                flatListRef.current?.scrollToEnd({ animated: true })
              }
            />

            {/* Selected Media Preview */}
            {(selectedImageUris.length > 0 || selectedVideoUris.length > 0 || uploadingMedia.size > 0) && (
              <View style={styles.selectedImagesContainer}>
                <FlatList
                  horizontal
                  data={[
                    // Selected media (chưa gửi)
                    ...selectedImageUris.map((uri, idx) => ({
                      type: "image",
                      uri,
                      index: idx,
                      isUploading: false,
                    })),
                    ...selectedVideoUris.map((uri, idx) => ({
                      type: "video",
                      uri,
                      index: idx,
                      isUploading: false,
                    })),
                    // Uploading media (đang upload)
                    ...Array.from(uploadingMedia.entries()).map(([uri, info]) => ({
                      type: info.type,
                      uri,
                      index: -1, // Không có index thật
                      isUploading: true,
                      uploadStatus: info.status,
                    })),
                  ]}
                  renderItem={({ item }) => {
                    const isUploadingItem = item.isUploading === true;
                    const uploadStatus = item.uploadStatus || '';
                    const isUploading = isUploadingItem && uploadStatus === 'uploading';
                    const isError = isUploadingItem && uploadStatus === 'error';
                    
                    return (
                      <View style={styles.selectedImageItem}>
                        {item.type === "video" ? (
                          <View style={styles.selectedVideo}>
                            <Ionicons
                              name="videocam"
                              size={40}
                              color={Colors.textLight}
                            />
                            <Text style={styles.videoLabel}>Video</Text>
                            {/* Loading overlay - hiển thị khi đang upload */}
                            {isUploadingItem && (
                              <View style={styles.uploadingOverlay}>
                                {isUploading && (
                                  <>
                                    <ActivityIndicator size="large" color="#fff" />
                                    <Text style={styles.uploadingStatusText}>Đang gửi</Text>
                                  </>
                                )}
                                {isError && (
                                  <Ionicons name="close-circle" size={40} color={Colors.error} />
                                )}
                              </View>
                            )}
                          </View>
                        ) : (
                          <View style={styles.selectedImageWrapper}>
                            <Image
                              source={{ uri: item.uri }}
                              style={styles.selectedImage}
                            />
                            {/* Loading overlay - hiển thị khi đang upload */}
                            {isUploadingItem && (
                              <View style={styles.uploadingOverlay}>
                                {isUploading && (
                                  <>
                                    <ActivityIndicator size="large" color="#fff" />
                                    <Text style={styles.uploadingStatusText}>Đang gửi</Text>
                                  </>
                                )}
                                {isError && (
                                  <Ionicons name="close-circle" size={40} color={Colors.error} />
                                )}
                              </View>
                            )}
                          </View>
                        )}
                        {/* Remove button - chỉ hiển thị khi không phải đang upload */}
                        {!isUploadingItem && (
                          <TouchableOpacity
                            style={styles.removeImageButton}
                            onPress={() => {
                              if (item.type === "video") {
                                handleRemoveVideo(item.index);
                              } else {
                                handleRemoveImage(item.index);
                              }
                            }}
                          >
                            <Ionicons
                              name="close-circle"
                              size={24}
                              color={Colors.error}
                            />
                          </TouchableOpacity>
                        )}
                      </View>
                    );
                  }}
                  keyExtractor={(item, index) => `${item.type}-${item.uri}-${index}`}
                  contentContainerStyle={styles.selectedImagesList}
                />
              </View>
            )}

            {/* Input Area */}
            <View style={styles.inputWrapper}>
              <View style={styles.inputContainer}>
                <TouchableOpacity
                  style={styles.mediaButton}
                  onPress={handleSelectMedia}
                  disabled={false} // Cho phép chọn media ngay cả khi đang upload
                >
                  <Ionicons
                    name="image-outline"
                    size={24}
                    color={Colors.primary}
                  />
                </TouchableOpacity>
                <TextInput
                  style={styles.textInput}
                  placeholder="Nhắn tin..."
                  placeholderTextColor={Colors.textPlaceholder}
                  value={messageText}
                  onChangeText={setMessageText}
                  multiline
                  maxLength={1000}
                  editable={true} // Luôn cho phép nhập text
                />
                <TouchableOpacity
                  style={[
                    styles.sendButton,
                    !messageText.trim() &&
                      selectedImageUris.length === 0 &&
                      selectedVideoUris.length === 0 &&
                      styles.sendButtonDisabled,
                  ]}
                  onPress={handleSendMessage}
                  disabled={
                    (!messageText.trim() &&
                      selectedImageUris.length === 0 &&
                      selectedVideoUris.length === 0) ||
                    isSending
                  }
                >
                  {isSending ? (
                    <ActivityIndicator size="small" color={Colors.textLight} />
                  ) : (
                    <Ionicons name="send" size={20} color={Colors.textLight} />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>

          {/* Emoji Picker Modal */}
          <Modal
            visible={showEmojiPicker}
            transparent
            animationType="fade"
            onRequestClose={() => setShowEmojiPicker(false)}
          >
            <TouchableOpacity
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={() => setShowEmojiPicker(false)}
            >
              <View style={styles.emojiPickerContainer}>
                <Text style={styles.emojiPickerTitle}>Chọn emoji</Text>
                <View style={styles.emojiGrid}>
                  {EMOJI_OPTIONS.map((emoji) => (
                    <TouchableOpacity
                      key={emoji}
                      style={styles.emojiOption}
                      onPress={() => handleEmojiSelect(emoji)}
                    >
                      <Text style={styles.emojiOptionText}>{emoji}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </TouchableOpacity>
          </Modal>

          {/* Video Player Modal */}
          <Modal
            visible={!!selectedVideoForPlayback}
            transparent={false}
            animationType="fade"
            onRequestClose={() => setSelectedVideoForPlayback(null)}
          >
            <View style={styles.videoModalContainer}>
              <View style={styles.videoModalHeader}>
                <TouchableOpacity
                  style={styles.videoModalCloseButton}
                  onPress={() => setSelectedVideoForPlayback(null)}
                >
                  <Ionicons name="close" size={28} color={Colors.text} />
                </TouchableOpacity>
              </View>
              {selectedVideoForPlayback && (
                <Video
                  source={{ uri: selectedVideoForPlayback }}
                  style={styles.fullscreenVideo}
                  useNativeControls
                  resizeMode={ResizeMode.CONTAIN}
                  isLooping={false}
                  shouldPlay={true}
                />
              )}
            </View>
          </Modal>
        </SafeAreaView>
      </ThemedView>
    </SwipeBackView>
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
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.background,
  },
  backButton: {
    width: 40,
    alignItems: "center",
  },
  headerCenter: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: FontSizes.md,
    fontWeight: "600",
    color: Colors.text,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  keyboardView: {
    flex: 1,
  },
  messagesList: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  messageContainer: {
    flexDirection: "row",
    marginBottom: Spacing.sm,
    alignItems: "flex-end",
  },
  messageContainerOwn: {
    flexDirection: "row-reverse",
  },
  messageAvatar: {
    marginRight: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  messageBubble: {
    maxWidth: "75%",
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 18,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomLeftRadius: 4,
    position: "relative",
  },
  messageBubbleOwn: {
    backgroundColor: Colors.primaryLight,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 4,
  },
  readStatusIndicator: {
    position: "absolute",
    bottom: 4,
    right: 4,
    width: 8,
    height: 8,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  readStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.textSecondary,
    opacity: 0.5,
  },
  readStatusDotRead: {
    backgroundColor: Colors.primary,
    opacity: 1,
  },
  messageMediaContainer: {
    marginBottom: Spacing.xs,
  },
  messageMediaItem: {
    marginBottom: Spacing.xs,
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
    resizeMode: "cover",
  },
  videoContainer: {
    position: "relative",
    width: 200,
    height: 200,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: Colors.backgroundDark,
  },
  messageVideo: {
    width: 200,
    height: 200,
  },
  videoOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  videoModalContainer: {
    flex: 1,
    backgroundColor: Colors.backgroundDark,
  },
  videoModalHeader: {
    paddingTop: Platform.OS === "ios" ? 50 : 20,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    flexDirection: "row",
    justifyContent: "flex-end",
    backgroundColor: Colors.backgroundDark,
  },
  videoModalCloseButton: {
    padding: Spacing.xs,
  },
  fullscreenVideo: {
    flex: 1,
    width: Dimensions.get("window").width,
    height: Dimensions.get("window").height,
  },
  messageText: {
    fontSize: FontSizes.md,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  messageTextOwn: {
    color: Colors.text,
  },
  messageFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  messageTime: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
  },
  messageTimeOwn: {
    color: Colors.textSecondary,
  },
  readIcon: {
    marginLeft: Spacing.xs,
  },
  reactionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: Spacing.xs,
    gap: Spacing.xs,
  },
  reactionBadge: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  reactionEmoji: {
    fontSize: 14,
  },
  reactionButton: {
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: Spacing.xs,
  },
  deleteMessageButton: {
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: Spacing.xs,
  },
  selectedImagesContainer: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.background,
    paddingVertical: Spacing.sm,
  },
  selectedImagesList: {
    paddingHorizontal: Spacing.md,
  },
  uploadingIndicatorContainer: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.background,
    paddingVertical: Spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
  },
  uploadingText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  selectedImageItem: {
    position: "relative",
    marginRight: Spacing.sm,
  },
  selectedImageWrapper: {
    position: "relative",
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: "hidden",
  },
  selectedImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    resizeMode: "cover",
  },
  selectedVideo: {
    width: 80,
    height: 80,
    backgroundColor: Colors.border,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  videoLabel: {
    marginTop: 4,
    fontSize: FontSizes.xs,
    color: Colors.textLight,
  },
  uploadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.xs,
  },
  uploadingStatusText: {
    color: "#fff",
    fontSize: FontSizes.xs,
    marginTop: Spacing.xs,
    fontWeight: "500",
  },
  removeImageButton: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: Colors.background,
    borderRadius: 12,
  },
  inputWrapper: {
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingBottom: Platform.OS === "ios" ? Spacing.xs : Spacing.xs,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  mediaButton: {
    padding: Spacing.xs,
  },
  textInput: {
    flex: 1,
    maxHeight: 100,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    backgroundColor: Colors.backgroundSecondary,
    color: Colors.text,
    fontSize: FontSizes.md,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: "center",
    alignItems: "center",
  },
  emojiPickerContainer: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: Spacing.lg,
    minWidth: 300,
  },
  emojiPickerTitle: {
    fontSize: FontSizes.md,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: Spacing.md,
    textAlign: "center",
  },
  emojiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: Spacing.md,
  },
  emojiOption: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.backgroundSecondary,
    justifyContent: "center",
    alignItems: "center",
  },
  emojiOptionText: {
    fontSize: 24,
  },
});
