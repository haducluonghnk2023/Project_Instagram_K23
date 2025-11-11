import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/colors";
import { Spacing, FontSizes } from "@/constants/styles";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Input, Button, ConfirmDialog } from "@/components/common";
import { useChangePassword } from "@/hooks/useAuth";
import { useToast } from "@/components/common/ToastProvider";
import { SwipeBackView } from "@/components/common";
import { useAuthContext } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";

export default function ChangePasswordScreen() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<{
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
    general?: string;
  }>({});
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  const { mutate: changePassword, isPending } = useChangePassword();
  const { logout } = useAuthContext();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const validatePassword = (password: string): boolean => {
    // At least 8 characters, one uppercase, one lowercase, one number, one special character
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  };

  const handleChangePassword = () => {
    // Clear previous errors
    setErrors({});

    // Validate
    let hasError = false;

    if (!currentPassword.trim()) {
      setErrors((prev) => ({
        ...prev,
        currentPassword: "Mật khẩu hiện tại không được để trống",
      }));
      hasError = true;
    }

    if (!newPassword.trim()) {
      setErrors((prev) => ({
        ...prev,
        newPassword: "Mật khẩu mới không được để trống",
      }));
      hasError = true;
    } else if (!validatePassword(newPassword)) {
      setErrors((prev) => ({
        ...prev,
        newPassword:
          "Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt (@$!%*?&)",
      }));
      hasError = true;
    }

    if (!confirmPassword.trim()) {
      setErrors((prev) => ({
        ...prev,
        confirmPassword: "Xác nhận mật khẩu không được để trống",
      }));
      hasError = true;
    } else if (newPassword !== confirmPassword) {
      setErrors((prev) => ({
        ...prev,
        confirmPassword: "Mật khẩu xác nhận không khớp",
      }));
      hasError = true;
    }

    if (currentPassword === newPassword) {
      setErrors((prev) => ({
        ...prev,
        newPassword: "Mật khẩu mới phải khác mật khẩu hiện tại",
      }));
      hasError = true;
    }

    if (hasError) {
      return;
    }

    // Call API
    changePassword(
      {
        currentPassword: currentPassword.trim(),
        newPassword: newPassword.trim(),
      },
      {
        onSuccess: async () => {
          // Clear form
          setCurrentPassword("");
          setNewPassword("");
          setConfirmPassword("");
          setErrors({});
          // Show success dialog
          setShowSuccessDialog(true);
        },
        onError: (error: any) => {
          // Clear previous errors
          const newErrors: {
            currentPassword?: string;
            newPassword?: string;
            confirmPassword?: string;
            general?: string;
          } = {};

          // Xử lý error từ backend
          if (error?.response?.data) {
            const serverData = error.response.data;
            const status = error.response.status;

            let errorMessage = "";

            // Lấy error message từ response
            if (serverData.data) {
              if (typeof serverData.data === 'string') {
                errorMessage = serverData.data;
              } else if (typeof serverData.data === 'object') {
                // Xử lý validation errors (400 Bad Request với Map<String, String>)
                const validationErrors = serverData.data;
                
                // Map errors theo field
                if (validationErrors.currentPassword) {
                  newErrors.currentPassword = validationErrors.currentPassword;
                }
                if (validationErrors.newPassword) {
                  newErrors.newPassword = validationErrors.newPassword;
                }

                // Nếu không có field cụ thể, lấy first error
                if (Object.keys(newErrors).length === 0) {
                  const firstError = Object.values(validationErrors)[0];
                  if (typeof firstError === 'string') {
                    errorMessage = firstError;
                  } else {
                    errorMessage = "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.";
                  }
                }
              } else if (serverData.data.message) {
                errorMessage = serverData.data.message;
              } else if (serverData.data.error) {
                errorMessage = serverData.data.error;
              }
            } else if (serverData.message) {
              errorMessage = serverData.message;
            } else if (serverData.error) {
              errorMessage = serverData.error;
            }

            // Map error message vào field tương ứng (chỉ khi chưa có field error)
            if (errorMessage && Object.keys(newErrors).length === 0) {
              const lowerMessage = errorMessage.toLowerCase();
              
              if (
                lowerMessage.includes("mật khẩu hiện tại không đúng") ||
                lowerMessage.includes("current password") ||
                lowerMessage.includes("wrong password") ||
                lowerMessage.includes("incorrect password")
              ) {
                newErrors.currentPassword = "Mật khẩu hiện tại không đúng";
              } else if (
                lowerMessage.includes("mật khẩu mới phải khác") ||
                lowerMessage.includes("new password must be different")
              ) {
                newErrors.newPassword = "Mật khẩu mới phải khác mật khẩu hiện tại";
              } else if (status === 400) {
                newErrors.general = errorMessage || "Dữ liệu không hợp lệ";
              } else if (status === 401) {
                newErrors.currentPassword = "Mật khẩu hiện tại không đúng";
              } else if (status === 500) {
                newErrors.general = "Lỗi máy chủ. Vui lòng thử lại sau.";
              } else if (errorMessage) {
                newErrors.general = errorMessage;
              } else {
                newErrors.general = "Có lỗi xảy ra khi đổi mật khẩu";
              }
            }
          }
          // Nếu không có response (network error)
          else if (error?.message) {
            if (error.message.includes("timeout") || error.message.includes("thời gian")) {
              newErrors.general = "Kết nối quá thời gian. Vui lòng kiểm tra mạng và thử lại.";
            } else if (error.message.includes("network") || error.message.includes("mạng")) {
              newErrors.general = "Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.";
            } else {
              newErrors.general = error.message;
            }
          } else {
            newErrors.general = "Có lỗi xảy ra khi đổi mật khẩu";
          }

          setErrors(newErrors);
        },
      }
    );
  };

  return (
    <SwipeBackView enabled={true} style={styles.container}>
      <ThemedView style={styles.container}>
        <SafeAreaView edges={["top"]} style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.headerIcon}
            >
              <Ionicons name="arrow-back" size={24} color={Colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Đổi mật khẩu</Text>
            <View style={styles.headerIcon} />
          </View>

          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.keyboardView}
          >
            <ScrollView
              showsVerticalScrollIndicator={false}
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.form}>
                {/* Current Password */}
                <View style={styles.inputContainer}>
                  <Input
                    placeholder="Mật khẩu hiện tại"
                    value={currentPassword}
                    onChangeText={(text) => {
                      setCurrentPassword(text);
                      if (errors.currentPassword) {
                        setErrors((prev) => ({
                          ...prev,
                          currentPassword: undefined,
                        }));
                      }
                    }}
                    secureTextEntry={!showCurrentPassword}
                    error={!!errors.currentPassword}
                    rightIcon={
                      <TouchableOpacity
                        onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                        style={styles.eyeIcon}
                      >
                        <Ionicons
                          name={showCurrentPassword ? "eye-off-outline" : "eye-outline"}
                          size={20}
                          color={Colors.textSecondary}
                        />
                      </TouchableOpacity>
                    }
                  />
                  {errors.currentPassword && (
                    <Text style={styles.errorText}>{errors.currentPassword}</Text>
                  )}
                </View>

                {/* New Password */}
                <View style={styles.inputContainer}>
                  <Input
                    placeholder="Mật khẩu mới"
                    value={newPassword}
                    onChangeText={(text) => {
                      setNewPassword(text);
                      if (errors.newPassword) {
                        setErrors((prev) => ({
                          ...prev,
                          newPassword: undefined,
                        }));
                      }
                    }}
                    secureTextEntry={!showNewPassword}
                    error={!!errors.newPassword}
                    rightIcon={
                      <TouchableOpacity
                        onPress={() => setShowNewPassword(!showNewPassword)}
                        style={styles.eyeIcon}
                      >
                        <Ionicons
                          name={showNewPassword ? "eye-off-outline" : "eye-outline"}
                          size={20}
                          color={Colors.textSecondary}
                        />
                      </TouchableOpacity>
                    }
                  />
                  {errors.newPassword && (
                    <Text style={styles.errorText}>{errors.newPassword}</Text>
                  )}
                </View>

                {/* Confirm Password */}
                <View style={styles.inputContainer}>
                  <Input
                    placeholder="Xác nhận mật khẩu mới"
                    value={confirmPassword}
                    onChangeText={(text) => {
                      setConfirmPassword(text);
                      if (errors.confirmPassword) {
                        setErrors((prev) => ({
                          ...prev,
                          confirmPassword: undefined,
                        }));
                      }
                    }}
                    secureTextEntry={!showConfirmPassword}
                    error={!!errors.confirmPassword}
                    rightIcon={
                      <TouchableOpacity
                        onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                        style={styles.eyeIcon}
                      >
                        <Ionicons
                          name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                          size={20}
                          color={Colors.textSecondary}
                        />
                      </TouchableOpacity>
                    }
                  />
                  {errors.confirmPassword && (
                    <Text style={styles.errorText}>{errors.confirmPassword}</Text>
                  )}
                </View>

                {/* General Error */}
                {errors.general && (
                  <View style={styles.generalErrorContainer}>
                    <Text style={styles.generalErrorText}>{errors.general}</Text>
                  </View>
                )}

                {/* Password Requirements */}
                <View style={styles.requirementsContainer}>
                  <Text style={styles.requirementsTitle}>Mật khẩu phải có:</Text>
                  <Text style={styles.requirementsText}>
                    • Ít nhất 8 ký tự
                  </Text>
                  <Text style={styles.requirementsText}>
                    • Ít nhất một chữ hoa
                  </Text>
                  <Text style={styles.requirementsText}>
                    • Ít nhất một chữ thường
                  </Text>
                  <Text style={styles.requirementsText}>
                    • Ít nhất một số
                  </Text>
                  <Text style={styles.requirementsText}>
                    • Ít nhất một ký tự đặc biệt (@$!%*?&)
                  </Text>
                </View>

                {/* Submit Button */}
                <Button
                  title={isPending ? "Đang xử lý..." : "Đổi mật khẩu"}
                  onPress={handleChangePassword}
                  variant="primary"
                  fullWidth
                  loading={isPending}
                  disabled={isPending}
                  style={styles.submitButton}
                />
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>

        {/* Success Dialog */}
        <ConfirmDialog
          visible={showSuccessDialog}
          title="Đổi mật khẩu thành công"
          message="Mật khẩu của bạn đã được thay đổi thành công. Vui lòng đăng nhập lại với mật khẩu mới để tiếp tục sử dụng."
          confirmText="Đăng nhập lại"
          cancelText={null}
          type="success"
          onConfirm={async () => {
            setShowSuccessDialog(false);
            try {
              // Clear all query cache
              queryClient.clear();
              // Logout to invalidate token
              await logout();
              // Redirect to login
              router.replace("/auth/login");
            } catch (error) {
              // Even if logout fails, still redirect to login
              router.replace("/auth/login");
            }
          }}
          onCancel={async () => {
            setShowSuccessDialog(false);
            try {
              // Clear all query cache
              queryClient.clear();
              // Logout to invalidate token
              await logout();
              // Redirect to login
              router.replace("/auth/login");
            } catch (error) {
              // Even if logout fails, still redirect to login
              router.replace("/auth/login");
            }
          }}
        />
      </ThemedView>
    </SwipeBackView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  headerIcon: {
    padding: Spacing.xs,
    width: 40,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: FontSizes.lg,
    fontWeight: "600",
    color: Colors.text,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  form: {
    width: "100%",
  },
  inputContainer: {
    marginBottom: Spacing.md,
  },
  eyeIcon: {
    padding: Spacing.xs,
  },
  errorText: {
    color: Colors.error,
    fontSize: FontSizes.xs,
    marginTop: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  generalErrorContainer: {
    backgroundColor: Colors.error + "15",
    padding: Spacing.md,
    borderRadius: 8,
    marginBottom: Spacing.md,
  },
  generalErrorText: {
    color: Colors.error,
    fontSize: FontSizes.sm,
  },
  requirementsContainer: {
    backgroundColor: Colors.backgroundSecondary,
    padding: Spacing.md,
    borderRadius: 8,
    marginBottom: Spacing.lg,
  },
  requirementsTitle: {
    fontSize: FontSizes.sm,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  requirementsText: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  submitButton: {
    marginTop: Spacing.md,
  },
});

