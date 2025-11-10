import { Button, Input } from "@/components/common";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { Colors } from "@/constants/colors";
import { CommonStyles, Spacing, FontSizes } from "@/constants/styles";
import { useMe, useUpdateMe } from "@/hooks/useAuth";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { uploadAvatarApi } from "@/services/upload.api";
import { showImagePickerOptions, pickImageFromLibrary, takePhotoFromCamera } from "@/utils/imagePicker";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Avatar } from "@/components/common";
import { Ionicons } from "@expo/vector-icons";
import { SwipeBackView, useToast } from "@/components/common";
import { getErrorMessage } from "@/utils/error";

export default function EditProfileScreen() {
  const { showToast } = useToast();
  const { data: userInfo, isLoading: isLoadingUser, refetch } = useMe();
  const { mutate: updateProfile, isPending } = useUpdateMe();
  
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [birthday, setBirthday] = useState("");
  const [gender, setGender] = useState("");
  const [location, setLocation] = useState("");
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [localAvatarUri, setLocalAvatarUri] = useState<string | null>(null);

  // Load user data into form
  useEffect(() => {
    if (userInfo?.profile) {
      const profile = userInfo.profile;
      setFullName(profile.fullName || "");
      setBio(profile.bio || "");
      setAvatarUrl(profile.avatarUrl || null);
      setBirthday(profile.birthday || "");
      setGender(profile.gender || "");
      setLocation(profile.location || "");
    }
  }, [userInfo]);

  const handleChangeAvatar = () => {
    showImagePickerOptions(
      async () => {
        // Chọn từ thư viện
        const result = await pickImageFromLibrary();
        if (!result.cancelled && result.uri) {
          await handleImageSelected(result.uri);
        }
      },
      async () => {
        // Chụp từ camera
        const result = await takePhotoFromCamera();
        if (!result.cancelled && result.uri) {
          await handleImageSelected(result.uri);
        }
      }
    );
  };

  const handleImageSelected = async (imageUri: string) => {
    setIsUploadingAvatar(true);
    setLocalAvatarUri(imageUri); // Hiển thị ảnh local ngay lập tức
    
    try {
      // Upload ảnh lên Cloudinary
      const uploadedUrl = await uploadAvatarApi(imageUri);
      
      // Cập nhật state với URL từ server
      setAvatarUrl(uploadedUrl);
      setLocalAvatarUri(null); // Xóa local URI vì đã có URL từ server
      
      showToast("Đã upload ảnh đại diện! Nhấn Lưu để cập nhật.", "success");
    } catch (error: unknown) {
      setLocalAvatarUri(null); // Xóa local URI nếu upload thất bại
      const errorMessage = getErrorMessage(error);
      showToast(errorMessage || "Không thể upload ảnh", "error");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSave = () => {
    if (!fullName.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập họ và tên");
      return;
    }

    updateProfile(
      {
        fullName: fullName.trim(),
        bio: bio.trim() || null,
        avatarUrl: avatarUrl || null,
        birthday: birthday || null,
        gender: gender || null,
        location: location.trim() || null,
      },
      {
        onSuccess: () => {
          refetch();
          // Quay về trang profile thay vì back (có thể back về trang khác)
          router.replace("/(tabs)/profile");
        },
        onError: (error: unknown) => {
          const errorMessage = getErrorMessage(error);
          showToast(errorMessage || "Có lỗi xảy ra khi cập nhật", "error");
        },
      }
    );
  };

  if (isLoadingUser) {
    return (
      <ThemedView style={[CommonStyles.container, CommonStyles.containerCentered]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </ThemedView>
    );
  }

  return (
    <SwipeBackView enabled={true} style={CommonStyles.container}>
      <ThemedView style={CommonStyles.container}>
      <SafeAreaView edges={["top"]} style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/(tabs)/profile');
              }
            }} 
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <ThemedText type="title" style={styles.headerTitle}>
            Chỉnh sửa hồ sơ
          </ThemedText>
          <TouchableOpacity
            onPress={handleSave}
            disabled={isPending}
            style={styles.saveButton}
          >
            {isPending ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <Text style={styles.saveButtonText}>Lưu</Text>
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
            {/* Avatar Section */}
            <View style={styles.avatarSection}>
              <View style={styles.avatarWrapper}>
                <Avatar source={localAvatarUri || avatarUrl} size={80} />
                {(isUploadingAvatar || isPending) && (
                  <View style={styles.avatarLoadingOverlay}>
                    <ActivityIndicator size="small" color="#fff" />
                  </View>
                )}
              </View>
              <TouchableOpacity
                style={[
                  styles.changeAvatarButton,
                  (isUploadingAvatar || isPending) && styles.changeAvatarButtonDisabled,
                ]}
                onPress={handleChangeAvatar}
                disabled={isUploadingAvatar || isPending}
              >
                <Text style={styles.changeAvatarText}>
                  {isUploadingAvatar ? "Đang upload..." : "Đổi ảnh đại diện"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Form Fields */}
            <View style={styles.formSection}>
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Họ và tên</Text>
                <Input
                  placeholder="Nhập họ và tên"
                  value={fullName}
                  onChangeText={setFullName}
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Tiểu sử</Text>
                <Input
                  placeholder="Viết tiểu sử về bạn"
                  value={bio}
                  onChangeText={setBio}
                  multiline
                  numberOfLines={4}
                  style={styles.bioInput}
                  maxLength={1000}
                />
                <Text style={styles.charCount}>
                  {bio.length}/1000 ký tự
                </Text>
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Ngày sinh</Text>
                <Input
                  placeholder="YYYY-MM-DD"
                  value={birthday}
                  onChangeText={setBirthday}
                  keyboardType="default"
                />
                <Text style={styles.hint}>
                  Định dạng: YYYY-MM-DD (ví dụ: 2000-01-15)
                </Text>
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Giới tính</Text>
                <View style={styles.genderContainer}>
                  {["Nam", "Nữ", "Khác"].map((g) => (
                    <TouchableOpacity
                      key={g}
                      style={[
                        styles.genderOption,
                        gender === g && styles.genderOptionActive,
                      ]}
                      onPress={() => setGender(g)}
                    >
                      <Text
                        style={[
                          styles.genderOptionText,
                          gender === g && styles.genderOptionTextActive,
                        ]}
                      >
                        {g}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Địa điểm</Text>
                <Input
                  placeholder="Nhập địa điểm"
                  value={location}
                  onChangeText={setLocation}
                  autoCapitalize="words"
                />
              </View>

            </View>

            {/* Email and Phone (Read-only) */}
            <View style={styles.infoSection}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{userInfo?.email || "N/A"}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Số điện thoại</Text>
                <Text style={styles.infoValue}>{userInfo?.phone || "N/A"}</Text>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
      </ThemedView>
    </SwipeBackView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
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
  saveButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  saveButtonText: {
    fontSize: FontSizes.md,
    fontWeight: "600",
    color: Colors.primary,
  },
  scrollContent: {
    paddingBottom: Spacing.xl,
  },
  avatarSection: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  avatarWrapper: {
    position: "relative",
  },
  avatarLoadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  changeAvatarButton: {
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  changeAvatarButtonDisabled: {
    opacity: 0.5,
  },
  changeAvatarText: {
    fontSize: FontSizes.md,
    fontWeight: "600",
    color: Colors.primary,
  },
  formSection: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.lg,
  },
  fieldContainer: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: FontSizes.sm,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  bioInput: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  charCount: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    textAlign: "right",
    marginTop: Spacing.xs,
  },
  hint: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    fontStyle: "italic",
  },
  genderContainer: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  genderOption: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    alignItems: "center",
  },
  genderOptionActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  genderOptionText: {
    fontSize: FontSizes.md,
    color: Colors.text,
  },
  genderOptionTextActive: {
    color: Colors.primary,
    fontWeight: "600",
  },
  infoSection: {
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.backgroundSecondary,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.borderLight,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  infoLabel: {
    fontSize: FontSizes.md,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  infoValue: {
    fontSize: FontSizes.md,
    color: Colors.text,
  },
});
