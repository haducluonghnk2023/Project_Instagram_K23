import { Button, Divider, Input, LinkText, Logo } from "@/components/common";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/colors";
import { CommonStyles, Spacing } from "@/constants/styles";
import { useAuthContext } from "@/contexts/AuthContext";
import { useRegister } from "@/hooks/useAuth";
import { AuthResponse, RegisterRequest } from "@/types/auth";
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
import { useToast } from "@/components/common/ToastProvider";
import { SafeAreaView } from "react-native-safe-area-context";

export default function RegisterScreen() {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<{
    email?: string;
    fullName?: string;
    phone?: string;
    password?: string;
    confirmPassword?: string;
    general?: string;
  }>({});
  const { mutate: register, isPending } = useRegister();
  const { invalidateAuth } = useAuthContext();
  const { showToast } = useToast();

  // Clear token cũ khi vào trang đăng ký (nếu có)
  React.useEffect(() => {
    invalidateAuth();
  }, [invalidateAuth]);

  // Không tự động redirect khi đã authenticated
  // Để user có thể xem trang register nếu họ muốn

  // Clear errors khi user nhập
  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
  };

  const handleFullNameChange = (text: string) => {
    setFullName(text);
    if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: undefined }));
  };

  const handlePhoneChange = (text: string) => {
    setPhone(text);
    if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }));
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
    if (errors.confirmPassword && confirmPassword) {
      setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
    }
  };

  const handleConfirmPasswordChange = (text: string) => {
    setConfirmPassword(text);
    if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
  };

  const strongPasswordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

  const handleRegister = () => {
    // Thu thập tất cả lỗi vào một object trước
    const validationErrors: {
      email?: string;
      fullName?: string;
      phone?: string;
      password?: string;
      confirmPassword?: string;
      general?: string;
    } = {};

    // Validate email
    if (!email.trim()) {
      validationErrors.email = "Email không được để trống";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      validationErrors.email = "Email không hợp lệ";
    }

    // Validate fullName
    if (!fullName.trim()) {
      validationErrors.fullName = "Họ và tên không được để trống";
    }

    // Validate phone
    if (!phone.trim()) {
      validationErrors.phone = "Số điện thoại không được để trống";
    } else if (!/^[0-9]{10,15}$/.test(phone)) {
      validationErrors.phone = "Số điện thoại phải gồm 10-15 chữ số (0-9)";
    }

    // Validate password
    if (!password.trim()) {
      validationErrors.password = "Mật khẩu không được để trống";
    } else if (!strongPasswordRegex.test(password)) {
      validationErrors.password = "Mật khẩu phải >=8 ký tự, có chữ hoa, chữ thường, số và ký tự đặc biệt.";
    }

    // Validate confirmPassword
    if (!confirmPassword.trim()) {
      validationErrors.confirmPassword = "Xác nhận mật khẩu không được để trống";
    } else if (password !== confirmPassword) {
      validationErrors.confirmPassword = "Mật khẩu xác nhận không khớp";
    }

    // Nếu có lỗi, hiển thị tất cả cùng lúc
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const payload: RegisterRequest = {
      email,
      fullName,
      password,
      phone,
    };

    register(payload, {
      onSuccess: async (data: any) => {
        // Đăng ký thành công - không tự động login
        // Chuyển sang trang login để user tự đăng nhập
        showToast("Đăng ký thành công! Vui lòng đăng nhập.", "success");
        // Đợi toast hiển thị xong rồi mới navigate
        setTimeout(() => {
          router.replace({
            pathname: "/auth/login",
            params: { email, password },
          });
        }, 1500); // Tăng timeout để đảm bảo toast hiển thị và user có thể thấy
      },
      onError: (error: any) => {
        const newErrors: {
          email?: string;
          fullName?: string;
          phone?: string;
          password?: string;
          confirmPassword?: string;
          general?: string;
        } = {};
        
        if (error?.response?.data) {
          const serverData = error.response.data;
          const status = error.response.status;
          
          // Xử lý validation errors (400 Bad Request với Map<String, String>)
          if (status === 400 && serverData.data && typeof serverData.data === 'object') {
            const validationErrors = serverData.data;
            
            // Map errors theo field
            if (validationErrors.email) {
              newErrors.email = validationErrors.email;
            }
            if (validationErrors.fullName) {
              newErrors.fullName = validationErrors.fullName;
            }
            if (validationErrors.phone) {
              newErrors.phone = validationErrors.phone;
            }
            if (validationErrors.password) {
              newErrors.password = validationErrors.password;
            }
            
            // Nếu không có field cụ thể, hiển thị general error
            if (Object.keys(newErrors).length === 0) {
              const firstError = Object.values(validationErrors)[0];
              if (typeof firstError === 'string') {
                newErrors.general = firstError;
              } else {
                newErrors.general = "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.";
              }
            }
          }
          // Xử lý các lỗi khác
          else {
            let errorMessage = "";
            
            if (serverData.data) {
              if (typeof serverData.data === 'string') {
                errorMessage = serverData.data;
              } else if (serverData.data.message) {
                errorMessage = serverData.data.message;
              } else if (serverData.data.error) {
                errorMessage = serverData.data.error;
              }
            } else if (serverData.message) {
              errorMessage = serverData.message;
            }
            
            // Map các message tiếng Anh sang tiếng Việt
            if (errorMessage.toLowerCase().includes("email") && 
                errorMessage.toLowerCase().includes("already exists") ||
                errorMessage.toLowerCase().includes("email đã tồn tại")) {
              newErrors.email = "Email đã được sử dụng. Vui lòng chọn email khác.";
            } else if (errorMessage.toLowerCase().includes("phone") && 
                       errorMessage.toLowerCase().includes("already exists") ||
                       errorMessage.toLowerCase().includes("số điện thoại đã tồn tại")) {
              newErrors.phone = "Số điện thoại đã được sử dụng. Vui lòng chọn số khác.";
            } else if (errorMessage) {
              newErrors.general = errorMessage;
            } else {
              newErrors.general = "Có lỗi xảy ra khi đăng ký";
            }
          }
        } 
        // Network errors
        else if (error?.message) {
          if (error.message.includes("timeout") || error.message.includes("thời gian")) {
            newErrors.general = "Kết nối quá thời gian. Vui lòng kiểm tra mạng và thử lại.";
          } else if (error.message.includes("network") || error.message.includes("mạng")) {
            newErrors.general = "Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.";
          } else {
            newErrors.general = error.message;
          }
        } else {
          newErrors.general = "Có lỗi xảy ra khi đăng ký";
        }
        
        setErrors(newErrors);
      },
    });
  };



  return (
    <ThemedView style={CommonStyles.container}>
      <SafeAreaView edges={["top", "bottom"]} style={CommonStyles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={CommonStyles.container}
        >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Logo size={80} />
            <ThemedText type="title" style={styles.title}>
              Instagram
            </ThemedText>
            <ThemedText style={styles.subtitle}>
              Đăng ký để xem ảnh và video từ bạn bè
            </ThemedText>
          </View>

          <View style={styles.form}>
            <View>
              <Input
                placeholder="Email"
                value={email}
                onChangeText={handleEmailChange}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                error={!!errors.email}
              />
              {errors.email && (
                <Text style={styles.errorText}>{errors.email}</Text>
              )}
            </View>

            <View>
              <Input
                placeholder="Họ và tên"
                value={fullName}
                onChangeText={handleFullNameChange}
                autoCapitalize="words"
                error={!!errors.fullName}
              />
              {errors.fullName && (
                <Text style={styles.errorText}>{errors.fullName}</Text>
              )}
            </View>

            <View>
              <Input
                placeholder="Số điện thoại"
                value={phone}
                onChangeText={handlePhoneChange}
                keyboardType="phone-pad"
                error={!!errors.phone}
              />
              {errors.phone && (
                <Text style={styles.errorText}>{errors.phone}</Text>
              )}
            </View>

            <View>
              <Input
                placeholder="Mật khẩu"
                value={password}
                onChangeText={handlePasswordChange}
                secureTextEntry
                autoCapitalize="none"
                error={!!errors.password}
              />
              {errors.password && (
                <Text style={styles.errorText}>{errors.password}</Text>
              )}
            </View>

            <View>
              <Input
                placeholder="Xác nhận mật khẩu"
                value={confirmPassword}
                onChangeText={handleConfirmPasswordChange}
                secureTextEntry
                autoCapitalize="none"
                error={!!errors.confirmPassword}
              />
              {errors.confirmPassword && (
                <Text style={styles.errorText}>{errors.confirmPassword}</Text>
              )}
            </View>

            {errors.general && (
              <View style={styles.generalErrorContainer}>
                <Text style={styles.errorText}>{errors.general}</Text>
              </View>
            )}

            <Button
              title={isPending ? "Đang đăng ký..." : "Đăng ký"}
              onPress={handleRegister}
              variant="primary"
              loading={isPending}
              disabled={isPending}
              fullWidth
            />

            <View style={styles.termsContainer}>
              <Text style={styles.termsText}>
                Bằng cách đăng ký, bạn đồng ý với <Text style={styles.termsLink}>Điều khoản</Text> và <Text style={styles.termsLink}>Chính sách quyền riêng tư</Text> của chúng tôi.
              </Text>
            </View>
          </View>

          <LinkText
            text="Bạn đã có tài khoản? "
            linkText="Đăng nhập"
            href="/auth/login"
          />
        </ScrollView>
      </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: Spacing.lg,
  },
  header: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: 36,
    fontWeight: "bold",
    marginBottom: Spacing.sm,
  },
  subtitle: {
    textAlign: "center",
    fontSize: 14,
    opacity: 0.7,
    paddingHorizontal: Spacing.lg,
  },
  form: {
    width: "100%",
  },
  termsContainer: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  termsText: {
    color: Colors.textSecondary,
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
  },
  termsLink: {
    color: Colors.primary,
    fontWeight: "600",
  },
  errorText: {
    color: Colors.error,
    fontSize: 12,
    marginTop: -Spacing.md + 4,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
  },
  generalErrorContainer: {
    backgroundColor: Colors.error + "15",
    padding: Spacing.md,
    borderRadius: 8,
    marginBottom: Spacing.md,
  },
});


