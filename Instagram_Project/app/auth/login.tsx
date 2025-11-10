import { Button, Divider, Input, LinkText, Logo } from "@/components/common";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/colors";
import { CommonStyles, Spacing } from "@/constants/styles";
import { useAuthContext } from "@/contexts/AuthContext";
import { useLogin } from "@/hooks/useAuth";
import { AuthResponse } from "@/types/auth";
import { router, useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
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

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    general?: string;
  }>({});
  const { mutate: login, isPending } = useLogin();
  const { login: authLogin } = useAuthContext();
  const { showToast } = useToast();

  const { email: emailParam, password: passwordParam } = useLocalSearchParams<{
    email?: string;
    password?: string;
  }>();
  const [isFillingFromParams, setIsFillingFromParams] = useState(false);

  useEffect(() => {
    if (emailParam || passwordParam) {
      setIsFillingFromParams(true);
      // Fill data ngay lập tức
      if (emailParam) setEmail(String(emailParam));
      if (passwordParam) setPassword(String(passwordParam));
      // Đợi một chút để đảm bảo state đã được update
      setTimeout(() => {
        setIsFillingFromParams(false);
      }, 100);
    }
  }, [emailParam, passwordParam]);

  // Không tự động redirect khi đã authenticated
  // Để user có thể xem trang login nếu họ muốn

  // Clear errors khi user nhập
  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (errors.email) {
      setErrors((prev) => ({ ...prev, email: undefined }));
    }
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    if (errors.password) {
      setErrors((prev) => ({ ...prev, password: undefined }));
    }
  };

  const handleLogin = () => {
    // Prevent login khi đang fill data từ params
    if (isFillingFromParams) {
      return;
    }

    // Clear previous errors
    setErrors({});

    // Validate email
    let hasError = false;
    if (!email.trim()) {
      setErrors((prev) => ({ ...prev, email: "Email không được để trống" }));
      hasError = true;
    } else {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        setErrors((prev) => ({ ...prev, email: "Email không hợp lệ. Vui lòng nhập đúng định dạng email" }));
        hasError = true;
      }
    }

    // Validate password
    if (!password.trim()) {
      setErrors((prev) => ({ ...prev, password: "Mật khẩu không được để trống" }));
      hasError = true;
    }

    if (hasError) {
      return;
    }

    login(
      { email, password },
      {
        onSuccess: async (data: any) => {
          try {
            // Backend trả về ResponseWrapper { status, code, data: AuthResponse }
            // Nên cần check cả data.data và data.accessToken
            const authData = data?.data || data;
            const token = authData?.accessToken || data?.accessToken;
            
            if (!token) {
              showToast("Không nhận được token từ server", "error");
              return;
            }
            
            await authLogin(token);
            // Navigation sẽ được xử lý tự động bởi RootLayoutNav khi isAuthenticated = true
          } catch (error: any) {
            setErrors((prev) => ({
              ...prev,
              general: error.message || "Có lỗi xảy ra khi đăng nhập",
            }));
          }
        },
        onError: (err: any) => {
          // Clear previous errors
          const newErrors: { email?: string; password?: string; general?: string } = {};
          
          // Xử lý error từ backend
          if (err?.response?.data) {
            const serverData = err.response.data;
            const status = err.response.status;
            
            // Xử lý validation errors (400 Bad Request với Map<String, String>)
            if (status === 400 && serverData.data && typeof serverData.data === 'object') {
              const validationErrors = serverData.data;
              
              // Map errors theo field
              if (validationErrors.email) {
                newErrors.email = validationErrors.email;
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
              } else if (serverData.error) {
                errorMessage = serverData.error;
              }
              
              // Map các message tiếng Anh sang tiếng Việt
              if (errorMessage.toLowerCase().includes("invalid credentials") || 
                  errorMessage.toLowerCase().includes("wrong password") ||
                  errorMessage.toLowerCase().includes("password incorrect")) {
                newErrors.password = "Sai mật khẩu. Vui lòng kiểm tra lại.";
              } else if (errorMessage.toLowerCase().includes("user not found") || 
                         errorMessage.toLowerCase().includes("email not found") ||
                         errorMessage.toLowerCase().includes("account not found") ||
                         errorMessage.toLowerCase().includes("email không tồn tại")) {
                newErrors.email = "Email không tồn tại trong hệ thống.";
              } else if (errorMessage.toLowerCase().includes("account is deactivated") ||
                         errorMessage.toLowerCase().includes("account deactivated")) {
                newErrors.general = "Tài khoản đã bị vô hiệu hóa. Vui lòng liên hệ hỗ trợ.";
              } else if (errorMessage.toLowerCase().includes("email is required") ||
                         errorMessage.toLowerCase().includes("email không được để trống")) {
                newErrors.email = "Email không được để trống";
              } else if (errorMessage.toLowerCase().includes("email must be valid") ||
                         errorMessage.toLowerCase().includes("email không hợp lệ")) {
                newErrors.email = "Email không hợp lệ. Vui lòng nhập đúng định dạng email";
              } else if (errorMessage.toLowerCase().includes("password is required") ||
                         errorMessage.toLowerCase().includes("mật khẩu không được để trống")) {
                newErrors.password = "Mật khẩu không được để trống";
              } else if (status === 401) {
                newErrors.password = "Email hoặc mật khẩu không đúng.";
              } else if (status === 403) {
                newErrors.general = "Bạn không có quyền truy cập.";
              } else if (status === 404) {
                newErrors.general = "Không tìm thấy tài khoản.";
              } else if (status === 500) {
                newErrors.general = "Lỗi máy chủ. Vui lòng thử lại sau.";
              } else if (errorMessage) {
                newErrors.general = errorMessage;
              } else {
                newErrors.general = "Có lỗi xảy ra khi đăng nhập";
              }
            }
          } 
          // Nếu không có response (network error)
          else if (err?.message) {
            if (err.message.includes("timeout") || err.message.includes("thời gian")) {
              newErrors.general = "Kết nối quá thời gian. Vui lòng kiểm tra mạng và thử lại.";
            } else if (err.message.includes("network") || err.message.includes("mạng")) {
              newErrors.general = "Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.";
            } else {
              newErrors.general = err.message;
            }
          } else {
            newErrors.general = "Có lỗi xảy ra khi đăng nhập";
          }
          
          setErrors(newErrors);
        },
      }
    );
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
          </View>

          <View style={styles.form}>
            <View>
              <Input
                placeholder="Email"
                value={email}
                onChangeText={handleEmailChange}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                error={!!errors.email}
              />
              {errors.email && (
                <Text style={styles.errorText}>{errors.email}</Text>
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

            {errors.general && (
              <View style={styles.generalErrorContainer}>
                <Text style={styles.errorText}>{errors.general}</Text>
              </View>
            )}

            <Button
              title={isPending ? "Đang đăng nhập..." : "Đăng nhập"}
              onPress={handleLogin}
              variant="primary"
              loading={isPending}
              disabled={isPending || isFillingFromParams}
              fullWidth
            />

            <View style={styles.forgotPasswordContainer}>
              <TouchableOpacity
                onPress={() => router.push("/auth/forgot-password")}
              >
                <Text style={styles.forgotPasswordText}>Quên mật khẩu?</Text>
              </TouchableOpacity>
            </View>
          </View>

          <LinkText
            text="Bạn chưa có tài khoản? "
            linkText="Đăng ký"
            href="/auth/register"
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
    marginBottom: Spacing.xl * 2,
  },
  title: {
    fontSize: 36,
    fontWeight: "bold",
  },
  form: {
    width: "100%",
  },
  forgotPasswordContainer: {
    alignItems: "center",
    marginTop: Spacing.lg,
  },
  forgotPasswordText: {
    color: Colors.primary,
    fontSize: 14,
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
